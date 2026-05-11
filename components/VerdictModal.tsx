'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { VerdictHero } from '@/components/Dashboard/VerdictHero'
import { KpiCards } from '@/components/Dashboard/KpiCards'
import { CourtFitPanel } from '@/components/Dashboard/CourtFitPanel'
import { FinancialBreakdown } from '@/components/Dashboard/FinancialBreakdown'
import { RiskFlagsPanel } from '@/components/Dashboard/RiskFlagsPanel'
import { SummaryPanel } from '@/components/Dashboard/SummaryPanel'
import { Pencil, Trash2 } from 'lucide-react'
import type { PropertyRow } from '@/lib/supabase/types'
import { calculateAnalysis } from '@/lib/calculator'
import { useMemo } from 'react'

interface Props {
  property: PropertyRow | null
  onClose: () => void
  onEdit: (row: PropertyRow) => void
  onDelete: (id: string) => void
}

export function VerdictModal({ property, onClose, onEdit, onDelete }: Props) {
  // Recompute the analysis from the persisted listing + assumptions so the
  // verdict reflects the latest calculator logic, not the row's stale snapshot.
  const result = useMemo(() => {
    if (!property) return null
    return calculateAnalysis({
      listing: property.listing_json,
      assumptions: property.assumptions_json,
    })
  }, [property])

  return (
    <Dialog
      open={!!property}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="verdict-modal sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <DialogTitle className="truncate">
              {property?.label || property?.address || 'Property analysis'}
            </DialogTitle>
            <div className="flex items-center gap-2 shrink-0">
              {property && (
                <Button variant="outline" size="sm" onClick={() => onEdit(property)} className="gap-1.5">
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              )}
              {property && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete "${property.label || property.address || 'this property'}"?`)) {
                      onDelete(property.id)
                    }
                  }}
                  className="gap-1.5 text-rose-300 hover:text-rose-200 hover:bg-rose-400/10"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {property && result && (
          <div className="space-y-4 mt-2">
            <VerdictHero result={result} address={property.address} />
            <KpiCards result={result} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <CourtFitPanel
                result={result}
                listing={property.listing_json}
                assumptions={property.assumptions_json}
              />
              <RiskFlagsPanel flags={result.riskFlags} />
            </div>
            <FinancialBreakdown result={result} />
            <SummaryPanel result={result} address={property.address} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
