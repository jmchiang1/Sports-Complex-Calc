'use client'

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
  const max = Math.max(...expenseData.map((d) => d.value))

  return (
    <div className="financial-breakdown-card surface p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-tight">Annual revenue & expenses</h3>
        <span
          className={`text-xs font-medium tabular-nums ${
            result.noi > 0 ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          NOI {fmtMoney(result.noi)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-sm tabular-nums">
          <Row label="Court revenue (badminton)" value={fmtMoney(result.revenue.badminton)} />
          <Row label="Court revenue (pickleball)" value={fmtMoney(result.revenue.pickleball)} />
          <Row label="Other revenue" value={fmtMoney(result.revenue.other)} />
          <Row label="Gross revenue" value={fmtMoney(result.revenue.gross)} bold />
          <div className="h-2" />
          <Row label="Total expenses" value={fmtMoney(result.expenses.total)} />
          <Row
            label="NOI"
            value={fmtMoney(result.noi)}
            bold
            highlight={result.noi > 0 ? 'text-emerald-300' : 'text-rose-300'}
          />
        </div>
        <div className="h-48 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expenseData} margin={{ left: 4, right: 4, top: 8 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'oklch(0.68 0.012 250)' }}
                tickLine={false}
                axisLine={{ stroke: 'oklch(1 0 0 / 0.08)' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'oklch(0.68 0.012 250)' }}
                tickFormatter={(v) => fmtMoney(v as number)}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                cursor={{ fill: 'oklch(1 0 0 / 0.04)' }}
                contentStyle={{
                  background: 'oklch(0.21 0.014 250)',
                  border: '1px solid oklch(1 0 0 / 0.10)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'oklch(0.97 0.005 250)' }}
                itemStyle={{ color: 'oklch(0.97 0.005 250)' }}
                formatter={((v: number) => fmtMoney(v)) as never}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {expenseData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.value === max ? 'oklch(0.82 0.16 195)' : 'oklch(0.45 0.02 250)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

const Row = ({
  label,
  value,
  bold,
  highlight,
}: {
  label: string
  value: string
  bold?: boolean
  highlight?: string
}) => (
  <div className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
    <span className={bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
      {label}
    </span>
    <span className={`tabular-nums ${bold ? 'font-semibold' : ''} ${highlight ?? 'text-foreground'}`}>
      {value}
    </span>
  </div>
)
