/**
 * API Route per l'upload di immagini su Supabase Storage.
 * POST /api/upload (multipart/form-data)
 * Richiede autenticazione.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const bucket = (formData.get("bucket") as string) || "images"
  const folder = (formData.get("folder") as string) || "uploads"

  if (!file) {
    return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato non supportato. Usa JPG, PNG, WebP o GIF." },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Il file supera il limite di 5MB." },
      { status: 400 }
    )
  }

  // Genera nome file univoco
  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error("[UPLOAD] Errore:", error)
    return NextResponse.json(
      { error: "Errore durante il caricamento" },
      { status: 500 }
    )
  }

  // Genera URL pubblico
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return NextResponse.json({ url: urlData.publicUrl })
}
