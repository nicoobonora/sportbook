#!/usr/bin/env python3
"""
Import scraped sport centers from SQLite into Supabase.

Reads from sportbook_script/backend/sportbook.db and inserts clubs
into the Supabase clubs table with claim_status='unclaimed'.

Usage:
    python3 scripts/import-scraped-clubs.py --db /path/to/sportbook.db [--dry-run]
"""

import sqlite3
import json
import re
import sys
import time
import argparse
import unicodedata
from collections import Counter

import requests

# ── Supabase config ──
SUPABASE_URL = "https://wdcvuyyrbmrzpjaksnpd.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3Z1eXlyYm1yenBqYWtzbnBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU4NTIwMiwiZXhwIjoyMDg4MTYxMjAyfQ.30BR3g2A0x-QCwHQ6dmC4sp6DBgP7YkydPe1rc_3PNs"

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

# ── Sport mapping ──
# Maps scraped sport types → Supabase sports array values
VALID_SPORTS = {
    "calcetto", "calcio", "padel", "tennis", "basket", "pallavolo",
    "nuoto", "beach-volley", "ping-pong", "badminton",
    "fitness", "crossfit", "yoga", "golf", "rugby", "atletica",
}

def map_sports(sport_types_str: str) -> list[str]:
    """Convert comma-separated sport string to array, filtering unknowns."""
    if not sport_types_str:
        return []
    sports = [s.strip().lower() for s in sport_types_str.split(",")]
    # Filter to only valid sports, skip "generale"
    return [s for s in sports if s in VALID_SPORTS]


def slugify(text: str) -> str:
    """Convert text to URL-safe slug."""
    # Normalize unicode → ASCII
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    # Replace common Italian chars
    text = text.replace("'", "").replace("'", "")
    # Replace non-alphanumeric with hyphens
    text = re.sub(r"[^a-z0-9]+", "-", text)
    # Collapse multiple hyphens and strip leading/trailing
    text = re.sub(r"-+", "-", text).strip("-")
    return text[:50]  # Max 50 chars


def make_unique_slug(base_slug: str, existing_slugs: set) -> str:
    """Ensure slug uniqueness by appending number if needed."""
    if not base_slug:
        base_slug = "club"
    slug = base_slug
    counter = 2
    while slug in existing_slugs:
        suffix = f"-{counter}"
        slug = base_slug[:50 - len(suffix)] + suffix
        counter += 1
    existing_slugs.add(slug)
    return slug


def read_scraped_data(db_path: str) -> list[dict]:
    """Read all sport centers from SQLite."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM sport_centers
        WHERE business_status = 'OPERATIONAL' OR business_status IS NULL
        ORDER BY region, city, name
    """)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


def transform_record(record: dict, existing_slugs: set) -> dict:
    """Transform a scraped record into a Supabase clubs row."""
    name = record["name"] or "Club Sportivo"
    base_slug = slugify(name)

    # Add city to slug for uniqueness if city is available
    city = record.get("city")
    if city:
        city_slug = slugify(city)
        base_slug = f"{base_slug}-{city_slug}"[:50]

    slug = make_unique_slug(base_slug, existing_slugs)
    sports = map_sports(record.get("sport_types", ""))

    return {
        "name": name[:100],
        "slug": slug,
        "sports": sports if sports else ["{}"],  # PostgreSQL empty array
        "address": record.get("address"),
        "city": city,
        "province": record.get("province"),
        "region": record.get("region"),
        "country": "IT",
        "latitude": record.get("latitude"),
        "longitude": record.get("longitude"),
        "phone": record.get("phone"),
        "google_place_id": record.get("place_id"),
        "google_maps_url": record.get("google_maps_url"),
        "website_url": record.get("website"),
        "google_rating": record.get("rating"),
        "google_total_ratings": record.get("total_ratings"),
        "business_status": record.get("business_status"),
        "is_active": True,
        "is_published": True,
        "claim_status": "unclaimed",
    }


def fetch_existing_slugs() -> set:
    """Get all existing slugs from Supabase to prevent collisions."""
    url = f"{SUPABASE_URL}/rest/v1/clubs?select=slug"
    resp = requests.get(url, headers={**HEADERS, "Prefer": ""})
    if resp.status_code == 200:
        return {r["slug"] for r in resp.json()}
    return set()


def fetch_existing_place_ids() -> set:
    """Get all existing google_place_ids to prevent duplicate imports."""
    url = f"{SUPABASE_URL}/rest/v1/clubs?select=google_place_id&google_place_id=not.is.null"
    resp = requests.get(url, headers={**HEADERS, "Prefer": ""})
    if resp.status_code == 200:
        return {r["google_place_id"] for r in resp.json()}
    return set()


def batch_insert(records: list[dict], batch_size: int = 50) -> tuple[int, int]:
    """Insert records into Supabase in batches. Returns (success, errors)."""
    url = f"{SUPABASE_URL}/rest/v1/clubs"
    success = 0
    errors = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        resp = requests.post(url, headers=HEADERS, json=batch)

        if resp.status_code in (200, 201):
            success += len(batch)
            print(f"  ✓ Batch {i // batch_size + 1}: {len(batch)} records inserted")
        else:
            # Try individual inserts for failed batch
            print(f"  ✗ Batch {i // batch_size + 1} failed ({resp.status_code}): {resp.text[:200]}")
            for record in batch:
                resp2 = requests.post(url, headers=HEADERS, json=record)
                if resp2.status_code in (200, 201):
                    success += 1
                else:
                    errors += 1
                    print(f"    ✗ Failed: {record['name'][:40]} — {resp2.text[:100]}")

        # Respect rate limits
        time.sleep(0.2)

    return success, errors


def run_migration():
    """Run the migration SQL via Supabase's SQL endpoint."""
    migration_path = "supabase/migrations/20250106000000_add_import_and_claim_columns.sql"
    try:
        with open(migration_path) as f:
            sql = f.read()
    except FileNotFoundError:
        print("⚠ Migration file not found locally, trying absolute path...")
        return False

    # Execute via Supabase REST SQL (requires service role)
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    resp = requests.post(url, headers=HEADERS, json={"query": sql})

    if resp.status_code in (200, 201, 204):
        print("✓ Migration applied successfully")
        return True
    else:
        print(f"⚠ Could not run migration via RPC (this is normal).")
        print(f"  Please run the migration manually in Supabase Dashboard > SQL Editor.")
        return False


def main():
    parser = argparse.ArgumentParser(description="Import scraped clubs into Supabase")
    parser.add_argument("--db", required=True, help="Path to sportbook.db SQLite file")
    parser.add_argument("--dry-run", action="store_true", help="Preview without inserting")
    parser.add_argument("--batch-size", type=int, default=50, help="Batch size for inserts")
    parser.add_argument("--skip-migration", action="store_true", help="Skip migration step")
    args = parser.parse_args()

    print("=" * 60)
    print("SportBook — Bulk Import from Scraped Data")
    print("=" * 60)

    # Step 1: Read scraped data
    print(f"\n📂 Reading scraped data from {args.db}...")
    scraped = read_scraped_data(args.db)
    print(f"  Found {len(scraped)} operational sport centers")

    # Step 2: Fetch existing data to prevent duplicates
    print("\n🔍 Checking existing data in Supabase...")
    existing_slugs = fetch_existing_slugs()
    existing_place_ids = fetch_existing_place_ids()
    print(f"  Existing clubs: {len(existing_slugs)}")
    print(f"  Existing place IDs: {len(existing_place_ids)}")

    # Step 3: Transform and filter
    print("\n🔄 Transforming records...")
    records = []
    skipped_duplicate = 0
    skipped_no_coords = 0
    sport_stats = Counter()

    for row in scraped:
        # Skip if already imported
        if row["place_id"] in existing_place_ids:
            skipped_duplicate += 1
            continue

        # Skip if no coordinates (can't show on map)
        if not row.get("latitude") or not row.get("longitude"):
            skipped_no_coords += 1
            continue

        record = transform_record(row, existing_slugs)

        # Fix empty sports array
        if record["sports"] == ["{}"] or not record["sports"]:
            record["sports"] = []

        for s in record["sports"]:
            sport_stats[s] += 1

        records.append(record)

    print(f"  Ready to import: {len(records)}")
    print(f"  Skipped (already imported): {skipped_duplicate}")
    print(f"  Skipped (no coordinates): {skipped_no_coords}")
    print(f"\n  Sports distribution:")
    for sport, count in sport_stats.most_common():
        print(f"    {sport}: {count}")

    no_sport_count = sum(1 for r in records if not r["sports"])
    print(f"    (no specific sport / 'generale'): {no_sport_count}")

    if args.dry_run:
        print("\n🏁 DRY RUN — no data inserted")
        print("\nSample records:")
        for r in records[:3]:
            print(f"  • {r['name']} ({r['city']}) → /{r['slug']} — sports: {r['sports']}")
        return

    # Step 4: Insert
    print(f"\n📤 Inserting {len(records)} clubs in batches of {args.batch_size}...")
    success, errors = batch_insert(records, args.batch_size)

    print(f"\n{'=' * 60}")
    print(f"✅ Import complete!")
    print(f"  Inserted: {success}")
    print(f"  Errors: {errors}")
    print(f"  Total clubs in platform: {len(existing_slugs) + success}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
