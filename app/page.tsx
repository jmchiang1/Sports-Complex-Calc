'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ListingInput } from '@/components/ListingInput'
import { PropertyForm } from '@/components/PropertyForm'
import { AssumptionsPanel } from '@/components/AssumptionsPanel'
import { VerdictHero } from '@/components/Dashboard/VerdictHero'
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
    <main className="max-w-[95vw] mx-auto w-full px-4 sm:px-6 py-6">
      <div className="flex items-end justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facility analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Paste a listing, refine the model, and get an instant verdict.
          </p>
        </div>
        <SavedPropertiesSheet
          onLoad={(row) => {
            setListing(row.listing_json)
            setAssumptions(row.assumptions_json)
            setSavedId(row.id)
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Inputs column */}
        <section className="inputs-column lg:col-span-5 space-y-4 min-w-0">
          <ListingInput onExtracted={(l) => setListing(l)} />
          <PropertyForm value={listing} onChange={setListing} />

          <div className="save-analysis-bar surface p-4 flex flex-wrap items-center gap-2">
            <Button onClick={save} disabled={pending}>
              {pending ? 'Saving…' : savedId ? 'Update saved analysis' : 'Save analysis'}
            </Button>
            <Button variant="ghost" onClick={reset}>Reset</Button>
            <Button variant="ghost" onClick={exportJson}>Export JSON</Button>
            {saveStatus && (
              <span className="text-xs text-muted-foreground ml-auto">{saveStatus}</span>
            )}
          </div>

          <AssumptionsPanel value={assumptions} onChange={setAssumptions} />
          <BookmarkletHelper />
        </section>

        {/* Analysis column — sticky on lg+ so it stays visible while editing */}
        <section className="analysis-column lg:col-span-7 space-y-4 min-w-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          <VerdictHero result={result} address={listing.address} />
          <KpiCards result={result} />
          <div className="court-and-risks-row grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CourtFitPanel result={result} listing={listing} assumptions={assumptions} />
            <RiskFlagsPanel flags={result.riskFlags} />
          </div>
          <FinancialBreakdown result={result} />
          <SummaryPanel result={result} address={listing.address} />
        </section>
      </div>
    </main>
  )
}
