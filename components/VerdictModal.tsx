'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { VerdictHero } from '@/components/Dashboard/VerdictHero'
import { KpiCards } from '@/components/Dashboard/KpiCards'
import { CourtFitPanel } from '@/components/Dashboard/CourtFitPanel'
import { FinancialBreakdown } from '@/components/Dashboard/FinancialBreakdown'
import { RiskFlagsPanel } from '@/components/Dashboard/RiskFlagsPanel'
import { SummaryPanel } from '@/components/Dashboard/SummaryPanel'
import { StartupCostBreakdown } from '@/components/Dashboard/StartupCostBreakdown'
import { Pencil, Trash2, MapPin, X, ExternalLink } from 'lucide-react'
import type { PropertyRow } from '@/lib/supabase/types'
import { calculateAnalysis } from '@/lib/calculator'
import { DEFAULT_ASSUMPTIONS } from '@/lib/constants'
import { useMemo } from 'react'

interface Props {
  property: PropertyRow | null
  onClose: () => void
  onEdit: (row: PropertyRow) => void
  onDelete: (id: string) => void
}

function PhotoStrip({
  images,
  sourceUrl,
}: {
  images: string[]
  sourceUrl: string | null
}) {
  return (
    <div className="photo-strip flex gap-2 overflow-x-auto pb-1">
      {images.map((src, i) => (
        <a
          key={src}
          href={sourceUrl || src}
          target="_blank"
          rel="noopener noreferrer"
          title="Open listing"
          className="block shrink-0 h-32 w-44 rounded-lg overflow-hidden ring-1 ring-border bg-card hover:ring-foreground/30 transition"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`Listing photo ${i + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Hide if the image fails to load (LoopNet CDN sometimes rejects hot-link)
              const target = e.currentTarget
              target.parentElement?.classList.add('hidden')
            }}
          />
        </a>
      ))}
    </div>
  )
}

export function VerdictModal({ property, onClose, onEdit, onDelete }: Props) {
  // Recompute the analysis from the persisted listing + assumptions so the
  // verdict reflects the latest calculator logic, not the row's stale snapshot.
  const result = useMemo(() => {
    if (!property) return null
    return calculateAnalysis({
      // Patch in default null/[] for fields older saved properties don't have.
      listing: {
        ...property.listing_json,
        sourceUrl: property.listing_json.sourceUrl ?? null,
        imageUrls: property.listing_json.imageUrls ?? [],
      },
      // Merge with defaults so old saved properties (missing the new
      // renovation-breakdown fields) still compute correctly.
      assumptions: { ...DEFAULT_ASSUMPTIONS, ...property.assumptions_json },
    })
  }, [property])

  return (
    <Dialog
      open={!!property}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="verdict-modal sm:max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <DialogTitle className="truncate">
                {property?.label || property?.address || 'Property analysis'}
              </DialogTitle>
              {property?.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Google Maps"
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MapPin className="size-4" />
                </a>
              )}
              {property?.listing_json.sourceUrl && (
                <a
                  href={property.listing_json.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open source listing"
                  className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="size-3.5" />
                  Listing
                </a>
              )}
            </div>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="size-8 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {property && result && (
          <div className="space-y-4 mt-2">
            {property.listing_json.imageUrls?.length > 0 && (
              <PhotoStrip
                images={property.listing_json.imageUrls}
                sourceUrl={property.listing_json.sourceUrl}
              />
            )}
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
            <StartupCostBreakdown result={result} />
            <SummaryPanel result={result} address={property.address} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
