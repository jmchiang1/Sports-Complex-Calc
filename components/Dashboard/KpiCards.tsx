import { fmtMoney, fmtPct } from '@/lib/format'
import type { AnalysisResult } from '@/types/analysis'

export function KpiCards({ result }: { result: AnalysisResult }) {
  const items: Array<{
    label: string
    value: string
    sub: string
    tone?: 'warn'
  }> = [
    {
      label: 'Gross revenue',
      value: fmtMoney(result.revenue.gross),
      sub: `${fmtMoney(result.monthlyRevenue)}/mo`,
    },
    {
      label: 'Expenses',
      value: fmtMoney(result.expenses.total),
      sub: `${fmtMoney(result.expenses.rent)} rent`,
    },
    {
      label: 'Rent burden',
      value: fmtPct(result.rentBurden),
      sub: result.rentBurden > 0.3 ? 'above 30% threshold' : 'within range',
      tone: result.rentBurden > 0.3 ? 'warn' : undefined,
    },
    {
      label: 'Revenue / sf',
      value: fmtMoney(result.revenuePerSqft),
      sub: 'per total sq ft',
    },
  ]

  return (
    <div className="kpi-cards-row grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((i) => (
        <div
          key={i.label}
          className="surface px-3.5 py-3 group hover:border-white/15 transition-colors"
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {i.label}
          </div>
          <div
            className={`mt-1 text-lg font-semibold tabular-nums ${
              i.tone === 'warn' ? 'text-amber-300' : 'text-foreground'
            }`}
          >
            {i.value}
          </div>
          <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{i.sub}</div>
        </div>
      ))}
    </div>
  )
}
