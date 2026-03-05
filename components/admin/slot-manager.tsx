/**
 * Gestore slot: orchestratore per la griglia calendario,
 * dialog template, dialog blocchi e lista blocchi.
 */
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Zap } from "lucide-react"
import type { Field, SlotTemplate, SlotBlock } from "@/lib/types/database"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScheduleGrid } from "./schedule-grid"
import { AddTemplateDialog } from "./add-template-dialog"
import { EditTemplateDialog } from "./edit-template-dialog"
import { BlockDialog } from "./block-dialog"
import { BlockList } from "./block-list"

type Props = {
  clubId: string
  fields: Field[]
  templates: SlotTemplate[]
  blocks: SlotBlock[]
}

export function SlotManager({ clubId, fields, templates, blocks }: Props) {
  const router = useRouter()

  // Campo selezionato
  const [selectedFieldId, setSelectedFieldId] = useState(fields[0]?.id ?? "")

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogDay, setAddDialogDay] = useState(1)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<SlotTemplate | null>(null)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [blockDialogDay, setBlockDialogDay] = useState<number | undefined>()
  const [blockDialogStart, setBlockDialogStart] = useState<string | undefined>()
  const [blockDialogEnd, setBlockDialogEnd] = useState<string | undefined>()

  // Genera slot
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<string | null>(null)

  // Filtra template e blocchi per il campo selezionato
  const fieldTemplates = useMemo(
    () => templates.filter((t) => t.field_id === selectedFieldId),
    [templates, selectedFieldId]
  )
  const fieldBlocks = useMemo(
    () => blocks.filter((b) => b.field_id === selectedFieldId),
    [blocks, selectedFieldId]
  )

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  // Check se il giorno ha già template custom
  const hasExistingTemplates = useMemo(
    () =>
      fieldTemplates.some(
        (t) => t.day_of_week === addDialogDay && t.is_active
      ),
    [fieldTemplates, addDialogDay]
  )

  // Handlers
  function handleAddTemplate(dayOfWeek: number) {
    setAddDialogDay(dayOfWeek)
    setAddDialogOpen(true)
  }

  function handleEditTemplate(template: SlotTemplate) {
    setEditTemplate(template)
    setEditDialogOpen(true)
  }

  async function handleDeleteTemplate(templateId: string) {
    if (!confirm("Eliminare questo slot dal template?")) return
    const supabase = createClient()
    await supabase
      .from("slot_templates")
      .delete()
      .eq("id", templateId)
      .eq("club_id", clubId)
    router.refresh()
  }

  function handleBlockSlot(dayOfWeek: number, startTime?: string, endTime?: string) {
    setBlockDialogDay(dayOfWeek)
    setBlockDialogStart(startTime)
    setBlockDialogEnd(endTime)
    setBlockDialogOpen(true)
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenerateResult(null)

    const response = await fetch("/api/slots/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ club_id: clubId, weeks: 4 }),
    })

    setGenerating(false)

    if (response.ok) {
      const data = await response.json()
      setGenerateResult(`Generati ${data.generated} slot per le prossime 4 settimane.`)
      router.refresh()
    } else {
      setGenerateResult("Errore nella generazione degli slot.")
    }
  }

  // Empty state: nessuna struttura
  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Nessuna struttura configurata.</p>
          <p className="mt-1 text-sm">
            Aggiungi le strutture dalle impostazioni prima di configurare gli orari.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Selettore campo ── */}
      {fields.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fields.map((field) => (
            <Button
              key={field.id}
              variant={selectedFieldId === field.id ? "default" : "outline"}
              size="sm"
              className="shrink-0 touch-target"
              onClick={() => setSelectedFieldId(field.id)}
            >
              {field.name}
              <span className="ml-1.5 text-xs opacity-70">({field.sport})</span>
            </Button>
          ))}
        </div>
      )}

      {/* ── Info campo ── */}
      {selectedField && fields.length <= 1 && (
        <p className="text-sm text-muted-foreground">
          {selectedField.name} ({selectedField.sport})
        </p>
      )}

      {/* ── Griglia calendario ── */}
      <ScheduleGrid
        templates={fieldTemplates}
        blocks={fieldBlocks}
        onAddTemplate={handleAddTemplate}
        onEditTemplate={handleEditTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onBlockSlot={handleBlockSlot}
      />

      {/* ── Lista blocchi ── */}
      <BlockList blocks={fieldBlocks} clubId={clubId} />

      {/* ── Genera slot ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" aria-hidden="true" />
            Genera slot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Genera automaticamente gli slot per le prossime 4 settimane
            partendo dai template configurati. Gli slot già esistenti non
            verranno duplicati, quelli bloccati verranno marcati.
          </p>

          {generateResult && (
            <div
              className="rounded-md bg-muted px-3 py-2 text-sm"
              role="status"
              aria-live="polite"
            >
              {generateResult}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="touch-target"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
                Genera slot (4 settimane)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Dialog ── */}
      <AddTemplateDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        clubId={clubId}
        fieldId={selectedFieldId}
        dayOfWeek={addDialogDay}
        hasExistingTemplates={hasExistingTemplates}
      />

      <EditTemplateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        template={editTemplate}
        clubId={clubId}
      />

      <BlockDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        clubId={clubId}
        fieldId={selectedFieldId}
        defaultDayOfWeek={blockDialogDay}
        defaultStartTime={blockDialogStart}
        defaultEndTime={blockDialogEnd}
      />
    </div>
  )
}
