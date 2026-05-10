'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { fmtMoney } from '@/lib/format'
import type { AnalysisResult } from '@/types/analysis'

export function FinancialBreakdown({ result }: { result: AnalysisResult }) {
  const expenseData = [
    { name: 'Rent', value: result.expenses.rent },
    { name: 'Payroll', value: result.expenses.payroll },
    { name: 'Utilities', value: result.expenses.utilities },
    { name: 'Insurance', value: result.expenses.insurance },
    { name: 'Maint.', value: result.expenses.maintenance },
    { name: 'Royalty', value: result.expenses.royalty },
    { name: 'Marketing', value: result.expenses.marketing },
    { name: 'Misc', value: result.expenses.miscAdmin },
  ]
  const max = Math.max(...expenseData.map(d => d.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Annual revenue & expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-sm tabular-nums">
            <Row label="Court revenue (badminton)" value={fmtMoney(result.revenue.badminton)} />
            <Row label="Court revenue (pickleball)" value={fmtMoney(result.revenue.pickleball)} />
            <Row label="Other revenue" value={fmtMoney(result.revenue.other)} />
            <Row label="Gross revenue" value={fmtMoney(result.revenue.gross)} bold />
            <div className="h-2" />
            <Row label="Total expenses" value={fmtMoney(result.expenses.total)} />
            <Row label="NOI" value={fmtMoney(result.noi)} bold highlight={result.noi > 0 ? 'text-emerald-700' : 'text-red-700'} />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} margin={{ left: -10, right: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtMoney(v as number)} />
                <Tooltip formatter={((v: number) => fmtMoney(v)) as any} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {expenseData.map((d, i) => (
                    <Cell key={i} fill={d.value === max ? '#92400e' : '#475569'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const Row = ({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: string }) => (
  <div className={`flex justify-between py-1.5 border-b border-dashed border-slate-200 last:border-0 ${highlight ?? ''}`}>
    <span className={bold ? 'font-semibold' : ''}>{label}</span>
    <span className={bold ? 'font-bold tabular-nums' : 'tabular-nums'}>{value}</span>
  </div>
)
