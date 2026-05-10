import { Card, CardContent } from '@/components/ui/card'
import { fmtMoney, fmtPct, fmtYears } from '@/lib/format'
import type { AnalysisResult } from '@/types/analysis'

export function KpiCards({ result }: { result: AnalysisResult }) {
  const items = [
    { label: 'Gross revenue', value: fmtMoney(result.revenue.gross), sub: `${fmtMoney(result.monthlyRevenue)}/mo` },
    {
      label: 'NOI',
      value: fmtMoney(result.noi),
      sub: result.revenue.gross > 0 ? `${fmtPct(result.noiMargin)} margin` : '—',
      className: result.noi <= 0 ? 'text-red-700' : '',
    },
    {
      label: 'Payback',
      value: fmtYears(result.paybackYears),
      sub: `${fmtMoney(result.startupCost.mid)} startup (mid)`,
    },
    {
      label: 'Rent burden',
      value: fmtPct(result.rentBurden),
      sub: `${fmtMoney(result.expenses.rent)}/yr`,
      className: result.rentBurden > 0.30 ? 'text-amber-700' : '',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(i => (
        <Card key={i.label}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{i.label}</div>
            <div className={`text-2xl font-semibold tabular-nums mt-1 ${i.className ?? ''}`}>
              {i.value}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">{i.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
