#!/usr/bin/env node
/**
 * SportBook — Bulk Import Script
 *
 * Imports 2000+ scraped sport centers into Supabase.
 * Run from the sportbook root directory:
 *   node scripts/import-clubs.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Config ──
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wdcvuyyrbmrzpjaksnpd.supabase.co"
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3Z1eXlyYm1yenBqYWtzbnBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU4NTIwMiwiZXhwIjoyMDg4MTYxMjAyfQ.30BR3g2A0x-QCwHQ6dmC4sp6DBgP7YkydPe1rc_3PNs"
const BATCH_SIZE = 100
const DRY_RUN = process.argv.includes("--dry-run")

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Step 1: Run migration ──
async function runMigration() {
  console.log("\n🔧 Step 1: Running migration (add new columns)...")

  const migrationSQL = `
    ALTER TABLE clubs ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'claimed';
    ALTER TABLE clubs ADD COLUMN IF NOT EXISTS google_place_id TEXT;
    ALTER TABLE clubs ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
    ALTER TABLE clubs ADD COLUMN IF NOT EXISTS website_url TEXT;
    ALTER TABLE clubs ADD COLUMN IF NOT EXISTS google_rating DOUBLE PRECISION;
    ALTER TABLE clubs ADD COLUMN IF NOT EXISTS google_total_ratings INTEGER;
    ALTER TABLE clubs ADD COLUMN IF NOT EXISTS business_status TEXT;
    ALTER TABLE clubs ADD COLUMN IF NOT EXISTS province TEXT;
  `

  // Execute each statement separately via raw SQL
  const statements = migrationSQL.split(";").map(s => s.trim()).filter(Boolean)

  for (const stmt of statements) {
    const { error } = await supabase.rpc("exec_sql", { query: stmt })
    if (error) {
      // If rpc doesn't exist, try direct approach
      console.log(`  ⚠ RPC not available, trying alternative...`)
      break
    }
  }

  // Verify columns exist by trying a select
  const { data, error } = await supabase
    .from("clubs")
    .select("id, claim_status, google_place_id")
    .limit(1)

  if (error) {
    console.error("  ✗ Migration columns not found. Please run the migration SQL first:")
    console.error("    File: scripts/import-all-clubs.sql (only the Step 1 section)")
    console.error("    Or run it in Supabase Dashboard → SQL Editor")
    console.error(`    Error: ${error.message}`)
    return false
  }

  console.log("  ✓ Migration columns verified")
  return true
}

// ── Step 2: Check existing data ──
async function getExistingData() {
  console.log("\n🔍 Step 2: Checking existing data...")

  // Get existing slugs
  const slugs = new Set()
  let page = 0
  const pageSize = 1000
  while (true) {
    const { data } = await supabase
      .from("clubs")
      .select("slug")
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (!data || data.length === 0) break
    data.forEach(r => slugs.add(r.slug))
    page++
  }

  // Get existing google_place_ids
  const placeIds = new Set()
  page = 0
  while (true) {
    const { data } = await supabase
      .from("clubs")
      .select("google_place_id")
      .not("google_place_id", "is", null)
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (!data || data.length === 0) break
    data.forEach(r => placeIds.add(r.google_place_id))
    page++
  }

  console.log(`  Existing clubs: ${slugs.size}`)
  console.log(`  Existing place IDs: ${placeIds.size}`)
  return { slugs, placeIds }
}

// ── Step 3: Import ──
async function importClubs() {
  console.log("=".repeat(60))
  console.log("SportBook — Bulk Import from Scraped Data")
  console.log("=".repeat(60))

  if (DRY_RUN) console.log("🏃 DRY RUN MODE — no data will be written\n")

  // Run migration
  const migrationOk = await runMigration()
  if (!migrationOk) {
    process.exit(1)
  }

  // Load data
  const dataPath = join(__dirname, "clubs-data.json")
  console.log(`\n📂 Step 3: Loading data from ${dataPath}...`)
  const allRecords = JSON.parse(readFileSync(dataPath, "utf-8"))
  console.log(`  Loaded ${allRecords.length} records`)

  // Check existing
  const { slugs: existingSlugs, placeIds: existingPlaceIds } = await getExistingData()

  // Filter out duplicates and fix slugs
  const records = []
  const usedSlugs = new Set(existingSlugs)
  let skippedDuplicate = 0

  for (const record of allRecords) {
    // Skip if already imported
    if (record.google_place_id && existingPlaceIds.has(record.google_place_id)) {
      skippedDuplicate++
      continue
    }

    // Ensure unique slug
    let slug = record.slug
    if (usedSlugs.has(slug)) {
      let counter = 2
      const base = slug.slice(0, 45)
      while (usedSlugs.has(slug)) {
        slug = `${base}-${counter}`
        counter++
      }
      record.slug = slug
    }
    usedSlugs.add(slug)
    records.push(record)
  }

  console.log(`\n📊 Summary:`)
  console.log(`  Ready to import: ${records.length}`)
  console.log(`  Skipped (already imported): ${skippedDuplicate}`)

  if (DRY_RUN) {
    console.log("\n🏁 DRY RUN complete. Sample records:")
    records.slice(0, 5).forEach(r => {
      console.log(`  • ${r.name} (${r.city || "?"}) → /${r.slug} — sports: [${r.sports.join(",")}]`)
    })
    return
  }

  // Batch insert
  console.log(`\n📤 Step 4: Inserting ${records.length} clubs in batches of ${BATCH_SIZE}...`)
  let success = 0
  let errors = 0

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(records.length / BATCH_SIZE)

    const { error } = await supabase.from("clubs").insert(batch)

    if (!error) {
      success += batch.length
      process.stdout.write(`\r  ✓ Batch ${batchNum}/${totalBatches} — ${success} records inserted`)
    } else {
      console.log(`\n  ✗ Batch ${batchNum} failed: ${error.message}`)
      // Try individual inserts
      for (const record of batch) {
        const { error: err2 } = await supabase.from("clubs").insert(record)
        if (!err2) {
          success++
        } else {
          errors++
          if (errors <= 10) {
            console.log(`    ✗ ${record.name.slice(0, 40)}: ${err2.message}`)
          }
        }
      }
    }
  }

  console.log(`\n\n${"=".repeat(60)}`)
  console.log(`✅ Import complete!`)
  console.log(`  Inserted: ${success}`)
  console.log(`  Errors: ${errors}`)

  // Final count
  const { count } = await supabase
    .from("clubs")
    .select("*", { count: "exact", head: true })
  console.log(`  Total clubs in platform: ${count}`)

  // Breakdown by claim status
  const { data: stats } = await supabase
    .from("clubs")
    .select("claim_status")

  if (stats) {
    const counts = {}
    stats.forEach(r => {
      counts[r.claim_status || "null"] = (counts[r.claim_status || "null"] || 0) + 1
    })
    console.log(`\n  By claim status:`)
    Object.entries(counts).forEach(([k, v]) => console.log(`    ${k}: ${v}`))
  }

  console.log(`${"=".repeat(60)}`)
}

importClubs().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
