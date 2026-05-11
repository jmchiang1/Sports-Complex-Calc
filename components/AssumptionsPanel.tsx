'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal } from 'lucide-react'
import type { Assumptions } from '@/types/analysis'
import { DEFAULT_ASSUMPTIONS } from '@/lib/constants'

interface Props {
  value: Assumptions
  onChange: (next: Assumptions) => void
}

const fields: Array<{ key: keyof Assumptions; label: string; step?: string }> = [
  { key: 'badmintonHourlyRate', label: 'Badminton $/hr' },
  { key: 'pickleballHourlyRate', label: 'Pickleball $/hr' },
  { key: 'badmintonReservedHoursPerWeek', label: 'Badminton hrs/wk' },
  { key: 'pickleballReservedHoursPerWeek', label: 'Pickleball hrs/wk' },
  { key: 'otherRevenuePct', label: 'Other revenue %', step: '0.01' },
  { key: 'badmintonMixPct', label: 'Badminton mix %', step: '0.01' },
  { key: 'pickleballMixPct', label: 'Pickleball mix %', step: '0.01' },
  { key: 'usableCourtAreaPct', label: 'Usable court area %', step: '0.01' },
  { key: 'badmintonCourtSqft', label: 'Badminton court sf' },
  { key: 'pickleballCourtSqft', label: 'Pickleball court sf' },
  { key: 'utilitiesPerSqftYr', label: 'Utilities $/sf/yr', step: '0.01' },
  { key: 'insurancePerSqftYr', label: 'Insurance $/sf/yr', step: '0.01' },
  { key: 'maintenancePerSqftYr', label: 'Maintenance $/sf/yr', step: '0.01' },
  { key: 'royaltyPct', label: 'Royalty %', step: '0.001' },
  { key: 'marketingPct', label: 'Marketing %', step: '0.001' },
  { key: 'miscAdminPct', label: 'Misc/Admin %', step: '0.001' },
  { key: 'payrollHourlyRate', label: 'Payroll $/hr' },
  { key: 'payrollHoursPerWeek', label: 'Payroll hrs/wk' },
  { key: 'payrollBurden', label: 'Payroll burden ×', step: '0.01' },
  { key: 'renovationPerSqftLow', label: 'Reno $/sf low' },
  { key: 'renovationPerSqftMid', label: 'Reno $/sf mid' },
  { key: 'renovationPerSqftHigh', label: 'Reno $/sf high' },
  { key: 'franchiseFee', label: 'Franchise fee' },
]

export function AssumptionsPanel({ value, onChange }: Props) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="assumptions-trigger gap-2">
            <SlidersHorizontal className="size-4" />
            Assumptions
          </Button>
        }
      />
      <DialogContent className="assumptions-dialog sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>Assumptions</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(DEFAULT_ASSUMPTIONS)}
            >
              Reset to defaults
            </Button>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {fields.map(f => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              <Input
                type="number"
                step={f.step}
                value={value[f.key]}
                onChange={e => onChange({ ...value, [f.key]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
