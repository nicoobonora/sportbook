/**
 * Lista dei blocchi attivi per un campo.
 * Mostra blocchi ricorrenti e su date specifiche con pulsante elimina.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2, Calendar, Repeat, Ban, Clock } from "lucide-react"
import type { SlotBlock } from "@/lib/types/database"
import { DAYS_OF_WEEK, formatDate, formatTime } from "@/lib/utils/dates"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  blocks: SlotBlock[]
  clubId: string
}

export function BlockList({ blocks, clubId }: Props) {
  if (blocks.length === 0) return null

  const recurringBlocks = blocks.filter((b) => b.block_type === "recurring")
  const dateBlocks = blocks.filter((b) => b.block_type === "single_date")

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Ban className="h-4 w-4" aria-hidden="true" />
          Blocchi attivi ({blocks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recurringBlocks.map((block) => (
          <BlockItem key={block.id} block={block} clubId={clubId} />
        ))}
        {dateBlocks.map((block) => (
          <BlockItem key={block.id} block={block} clubId={clubId} />
        ))}
      </CardContent>
    </Card>
  )
}

function BlockItem({ block, clubId }: { block: SlotBlock; clubId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm("Eliminare questo blocco?")) return
    setDeleting(true)

    const supabase = createClient()
    await supabase
      .from("slot_blocks")
      .delete()
      .eq("id", block.id)
      .eq("club_id", clubId)

    setDeleting(false)
    router.refresh()
  }

  const isRecurring = block.block_type === "recurring"
  const hasTimeRange = block.start_time && block.end_time

  return (
    <div className="flex items-center justify-between rounded-md border p-2.5 bg-red-50/50 dark:bg-red-950/20">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 gap-1"
          >
            {isRecurring ? (
              <>
                <Repeat className="h-2.5 w-2.5" aria-hidden="true" />
                Ricorrente
              </>
            ) : (
              <>
                <Calendar className="h-2.5 w-2.5" aria-hidden="true" />
                Data
              </>
            )}
          </Badge>

          <span className="text-sm font-medium">
            {isRecurring
              ? DAYS_OF_WEEK[block.day_of_week!]
              : formatDate(block.block_date!)}
          </span>

          {hasTimeRange && (
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <Clock className="h-2.5 w-2.5" aria-hidden="true" />
              {formatTime(block.start_time!)}–{formatTime(block.end_time!)}
            </span>
          )}

          {!hasTimeRange && (
            <span className="text-xs text-muted-foreground">
              Tutto il giorno
            </span>
          )}
        </div>

        {block.reason && (
          <p className="text-xs text-muted-foreground pl-0.5">
            {block.reason}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 touch-target text-muted-foreground hover:text-red-600"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Elimina blocco"
      >
        {deleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  )
}
