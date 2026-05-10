import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalysisResult, ExtractedListing, Assumptions } from '@/types/analysis'

interface Props {
  result: AnalysisResult
  listing: ExtractedListing
  assumptions: Assumptions
}

export function CourtFitPanel({ result, listing, assumptions }: Props) {
  const warehouseSqft = listing.warehouseSqft ?? listing.totalSqft ?? 0
  const usable = warehouseSqft * assumptions.usableCourtAreaPct
  const tooFew = result.courts.total > 0 && result.courts.total < 6

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Court fit · {Math.round(usable).toLocaleString()} sf usable
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm tabular-nums">
        <Row label={`Badminton (${assumptions.badmintonCourtSqft} sf each)`} value={`${result.courts.badminton} courts`} />
        <Row label={`Pickleball (${assumptions.pickleballCourtSqft} sf each)`} value={`${result.courts.pickleball} courts`} />
        <Row
          label="Total planned"
          value={`${result.courts.total} / 6 target`}
          highlight={tooFew ? 'text-amber-700' : ''}
        />
      </CardContent>
    </Card>
  )
}

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: string }) => (
  <div className={`flex justify-between py-1.5 border-b border-dashed border-slate-200 last:border-0 ${highlight ?? ''}`}>
    <span>{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
)
