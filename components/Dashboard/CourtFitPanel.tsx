import type { AnalysisResult, ExtractedListing, Assumptions } from '@/types/analysis'

interface Props {
  result: AnalysisResult
  listing: ExtractedListing
  assumptions: Assumptions
}

export function CourtFitPanel({ result, listing, assumptions }: Props) {
  const warehouseSqft = listing.warehouseSqft ?? listing.totalSqft ?? 0
  const usable = warehouseSqft * assumptions.usableCourtAreaPct
  const target = 6
  const total = result.courts.total
  const pct = Math.min(1, total / target)
  const tooFew = total > 0 && total < target
  const enough = total >= target

  return (
    <div className="surface p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-tight">Court fit</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.round(usable).toLocaleString()} sf usable
        </span>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="text-3xl font-semibold tabular-nums">
            {total}
            <span className="text-base font-normal text-muted-foreground"> / {target}</span>
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
            total courts
          </div>
        </div>
        <span
          className={`text-[11px] uppercase tracking-wider font-medium ${
            enough
              ? 'text-emerald-300'
              : tooFew
                ? 'text-amber-300'
                : 'text-muted-foreground'
          }`}
        >
          {enough ? 'meets target' : tooFew ? 'under target' : 'no fit yet'}
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all ${
            enough ? 'bg-emerald-400' : tooFew ? 'bg-amber-400' : 'bg-white/20'
          }`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="space-y-2.5 text-sm">
        <SportRow
          label="Badminton"
          sub={`${assumptions.badmintonCourtSqft} sf each`}
          courts={result.courts.badminton}
          accent="bg-cyan-400"
        />
        <SportRow
          label="Pickleball"
          sub={`${assumptions.pickleballCourtSqft} sf each`}
          courts={result.courts.pickleball}
          accent="bg-violet-400"
        />
      </div>
    </div>
  )
}

function SportRow({
  label,
  sub,
  courts,
  accent,
}: {
  label: string
  sub: string
  courts: number
  accent: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        <div className="min-w-0">
          <div className="text-foreground">{label}</div>
          <div className="text-[11px] text-muted-foreground">{sub}</div>
        </div>
      </div>
      <div className="text-base font-semibold tabular-nums">{courts}</div>
    </div>
  )
}
