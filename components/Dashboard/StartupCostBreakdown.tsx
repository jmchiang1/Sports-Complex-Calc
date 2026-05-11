import { fmtMoney } from '@/lib/format'
import type { AnalysisResult } from '@/types/analysis'

export function StartupCostBreakdown({ result }: { result: AnalysisResult }) {
  const { startupCost } = result

  return (
    <div className="startup-cost-card surface p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-tight">Startup cost breakdown</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {fmtMoney(startupCost.low)} – {fmtMoney(startupCost.high)} range
        </span>
      </div>

      <div className="text-sm tabular-nums">
        {startupCost.breakdown.map((item) => (
          <Row key={item.label} label={item.label} value={fmtMoney(item.amount)} />
        ))}
        <div className="h-2" />
        <Row label="Total (mid estimate)" value={fmtMoney(startupCost.mid)} bold />
      </div>
    </div>
  )
}

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
    <span className={bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{label}</span>
    <span className={`tabular-nums ${bold ? 'font-semibold' : ''} text-foreground`}>{value}</span>
  </div>
)
