import type { RiskFlag } from '@/types/analysis'

const severityStyles: Record<
  RiskFlag['severity'],
  { dot: string; label: string; chip: string }
> = {
  high: {
    dot: 'bg-rose-400',
    label: 'text-rose-300',
    chip: 'bg-rose-400/10 ring-1 ring-rose-400/25',
  },
  medium: {
    dot: 'bg-amber-400',
    label: 'text-amber-300',
    chip: 'bg-amber-400/10 ring-1 ring-amber-400/25',
  },
  low: {
    dot: 'bg-white/40',
    label: 'text-muted-foreground',
    chip: 'bg-white/5 ring-1 ring-white/10',
  },
}

export function RiskFlagsPanel({ flags }: { flags: RiskFlag[] }) {
  return (
    <div className="risk-flags-card surface p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-tight">Risks to confirm</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {flags.length} {flags.length === 1 ? 'flag' : 'flags'}
        </span>
      </div>

      {flags.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center">
          <div className="text-sm text-emerald-300">No major risk flags.</div>
          <div className="text-xs text-muted-foreground mt-1">
            Inputs look healthy across the board.
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {flags.map((f) => {
            const s = severityStyles[f.severity]
            return (
              <li key={f.id} className={`rounded-lg px-3 py-2.5 ${s.chip}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
                  <div className="min-w-0">
                    <div className={`text-sm font-medium ${s.label}`}>{f.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {f.detail}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
