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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
    <main className="max-w-[95vw] mx-auto w-full px-4 sm:px-6 py-4">
      <Tabs defaultValue="edit" className="w-full">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <TabsList className="grid grid-cols-2 w-full max-w-sm">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="verdict">Verdict</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportJson}>Export JSON</Button>
            <SavedPropertiesSheet
              onLoad={(row) => {
                setListing(row.listing_json)
                setAssumptions(row.assumptions_json)
                setSavedId(row.id)
              }}
            />
          </div>
        </div>

        <TabsContent value="edit" className="edit-tab">
          <div className="inputs-column space-y-4">
            <ListingInput
              onExtracted={(l) => setListing(l)}
              headerAction={<BookmarkletHelper />}
            />
            <PropertyForm
              value={listing}
              onChange={setListing}
              headerAction={<AssumptionsPanel value={assumptions} onChange={setAssumptions} />}
            />

            <div className="save-analysis-bar flex flex-wrap items-center justify-end gap-3 p-1">
              {saveStatus && (
                <span className="text-xs text-muted-foreground mr-auto">{saveStatus}</span>
              )}
              <Button variant="ghost" onClick={reset}>Reset</Button>
              <Button size="lg" onClick={save} disabled={pending} className="px-6">
                {pending ? 'Saving…' : savedId ? 'Update saved analysis' : 'Save analysis'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="verdict" className="verdict-tab">
          <div className="analysis-column space-y-4">
            <VerdictHero result={result} address={listing.address} />
            <KpiCards result={result} />
            <div className="court-and-risks-row grid grid-cols-1 xl:grid-cols-2 gap-4">
              <CourtFitPanel result={result} listing={listing} assumptions={assumptions} />
              <RiskFlagsPanel flags={result.riskFlags} />
            </div>
            <FinancialBreakdown result={result} />
            <SummaryPanel result={result} address={listing.address} />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
