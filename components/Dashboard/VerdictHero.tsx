import { fmtMoney, fmtPct, fmtYears } from '@/lib/format'
import type { AnalysisResult, Rating } from '@/types/analysis'

const verdictStyles: Record<Rating, {
  chip: string
  glow: string
  ring: string
  dot: string
  blurb: string
}> = {
  'Strong Candidate': {
    chip: 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30',
    glow: 'from-emerald-400/25 via-emerald-300/10 to-transparent',
    ring: 'ring-emerald-400/20',
    dot: 'bg-emerald-400',
    blurb: 'Numbers, fit, and risk profile all support pursuing this property.',
  },
  'Worth Investigating': {
    chip: 'bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/30',
    glow: 'from-cyan-400/25 via-cyan-300/10 to-transparent',
    ring: 'ring-cyan-400/20',
    dot: 'bg-cyan-400',
    blurb: 'Promising fundamentals — confirm the flagged items before moving forward.',
  },
  'Risky': {
    chip: 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30',
    glow: 'from-amber-400/25 via-amber-300/10 to-transparent',
    ring: 'ring-amber-400/20',
    dot: 'bg-amber-400',
    blurb: 'Several risk factors stack up — verify them before committing time.',
  },
  'Do Not Pursue': {
    chip: 'bg-rose-400/15 text-rose-300 ring-1 ring-rose-400/30',
    glow: 'from-rose-500/25 via-rose-400/10 to-transparent',
    ring: 'ring-rose-400/20',
    dot: 'bg-rose-400',
    blurb: 'Fundamentals don’t support a viable build-out at this property.',
  },
  'Incomplete': {
    chip: 'bg-white/10 text-muted-foreground ring-1 ring-white/15',
    glow: 'from-white/10 via-white/5 to-transparent',
    ring: 'ring-white/10',
    dot: 'bg-muted-foreground',
    blurb: 'Add a few more inputs to unlock the full verdict.',
  },
}

export function VerdictHero({
  result,
  address,
}: {
  result: AnalysisResult
  address: string | null
}) {
  const v = verdictStyles[result.rating]
  const noiPositive = result.noi > 0

  return (
    <div className={`verdict-hero surface relative overflow-hidden ${v.ring}`}>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${v.glow}`}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(closest-side, var(--brand), transparent)' }}
      />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Verdict
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight truncate">
              {address || 'Untitled property'}
            </h2>
          </div>
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap ${v.chip}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
            {result.rating}
          </span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground max-w-xl">{v.blurb}</p>

        <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
          <Stat
            label="NOI"
            value={fmtMoney(result.noi)}
            sub={
              result.revenue.gross > 0
                ? `${fmtPct(result.noiMargin)} margin`
                : 'no revenue yet'
            }
            tone={noiPositive ? 'good' : 'bad'}
          />
          <Stat
            label="Payback"
            value={fmtYears(result.paybackYears)}
            sub={`${fmtMoney(result.startupCost.mid)} startup`}
          />
          <Stat
            label="Courts"
            value={String(result.courts.total)}
            sub={`${result.courts.badminton}b · ${result.courts.pickleball}p`}
            tone={result.courts.total >= 6 ? 'good' : result.courts.total > 0 ? 'warn' : undefined}
          />
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone?: 'good' | 'warn' | 'bad'
}) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-300'
      : tone === 'warn'
        ? 'text-amber-300'
        : tone === 'bad'
          ? 'text-rose-300'
          : 'text-foreground'
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl sm:text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{sub}</div>
    </div>
  )
}
