'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ListingInput } from '@/components/ListingInput'
import { PropertyForm } from '@/components/PropertyForm'
import { AssumptionsPanel } from '@/components/AssumptionsPanel'
import { RatingBadge } from '@/components/Dashboard/RatingBadge'
import { KpiCards } from '@/components/Dashboard/KpiCards'
import { CourtFitPanel } from '@/components/Dashboard/CourtFitPanel'
import { FinancialBreakdown } from '@/components/Dashboard/FinancialBreakdown'
import { RiskFlagsPanel } from '@/components/Dashboard/RiskFlagsPanel'
import { SummaryPanel } from '@/components/Dashboard/SummaryPanel'
import { SavedPropertiesSheet } from '@/components/SavedPropertiesSheet'
import { BookmarkletHelper } from '@/components/BookmarkletHelper'
import { calculateAnalysis } from '@/lib/calculator'
import { DEFAULT_ASSUMPTIONS, EMPTY_LISTING } from '@/lib/constants'
import { saveProperty } from '@/app/actions/save-property'
import type { Assumptions, ExtractedListing } from '@/types/analysis'

export default function Page() {
  const [listing, setListing] = useState<ExtractedListing>({ ...EMPTY_LISTING })
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS)
  const [savedId, setSavedId] = useState<string | undefined>(undefined)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const result = useMemo(
    () => calculateAnalysis({ listing, assumptions }),
    [listing, assumptions],
  )

  const reset = () => {
    setListing({ ...EMPTY_LISTING })
    setAssumptions(DEFAULT_ASSUMPTIONS)
    setSavedId(undefined)
  }

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ listing, assumptions, result }, null, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${listing.address?.replace(/\W+/g, '-') || 'analysis'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const save = () =>
    start(async () => {
      setSaveStatus(null)
      const r = await saveProperty({
        id: savedId,
        label: listing.address,
        address: listing.address,
        listing,
        assumptions,
        snapshot: {
          rating: result.rating,
          noi: result.noi,
          totalCourts: result.courts.total,
          paybackYears: result.paybackYears,
        },
      })
      if ('error' in r) {
        setSaveStatus(r.error === 'not_authenticated' ? 'Sign in to save.' : `Error: ${r.error}`)
      } else {
        setSavedId(r.id)
        setSaveStatus('Saved.')
      }
    })

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">Paste a listing → review → save → compare.</div>
        <SavedPropertiesSheet
          onLoad={(row) => {
            setListing(row.listing_json)
            setAssumptions(row.assumptions_json)
            setSavedId(row.id)
          }}
        />
      </div>

      <ListingInput onExtracted={(l) => setListing(l)} />
      <BookmarkletHelper />
      <PropertyForm value={listing} onChange={setListing} />
      <AssumptionsPanel value={assumptions} onChange={setAssumptions} />

      <section className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Analysis</h2>
          <RatingBadge rating={result.rating} />
        </div>

        <KpiCards result={result} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CourtFitPanel result={result} listing={listing} assumptions={assumptions} />
          <RiskFlagsPanel flags={result.riskFlags} />
        </div>

        <FinancialBreakdown result={result} />

        <SummaryPanel result={result} address={listing.address} />
      </section>

      <div className="flex items-center gap-2 pt-3 border-t">
        <Button onClick={save} disabled={pending}>
          {pending ? 'Saving…' : savedId ? 'Update saved analysis' : 'Save analysis'}
        </Button>
        <Button variant="ghost" onClick={reset}>Reset</Button>
        <Button variant="ghost" onClick={exportJson}>Export JSON</Button>
        {saveStatus && <span className="text-sm text-slate-500 ml-2">{saveStatus}</span>}
      </div>
    </main>
  )
}
