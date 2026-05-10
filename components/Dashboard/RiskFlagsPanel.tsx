import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RiskFlag } from '@/types/analysis'

const severityStyles: Record<RiskFlag['severity'], string> = {
  high: 'bg-[#fef2f2] text-[#991b1b] border-l-[3px] border-red-500',
  medium: 'bg-[#fffbeb] text-[#92400e] border-l-[3px] border-amber-500',
  low: 'bg-[#f1f5f9] text-[#475569] border-l-[3px] border-slate-400',
}

export function RiskFlagsPanel({ flags }: { flags: RiskFlag[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Risks to confirm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {flags.length === 0 ? (
          <p className="text-sm text-slate-500">No major risk flags triggered.</p>
        ) : (
          flags.map(f => (
            <div key={f.id} className={`px-3 py-2 rounded text-sm ${severityStyles[f.severity]}`}>
              <div className="font-semibold">{f.title}</div>
              <div className="text-xs mt-1 opacity-90">{f.detail}</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
