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

type Field = { key: keyof Assumptions; label: string; step?: string }

const groups: Array<{ label: string; fields: Field[] }> = [
  {
    label: 'Court mix & utilization',
    fields: [
      { key: 'badmintonMixPct', label: 'Badminton mix %', step: '0.01' },
      { key: 'pickleballMixPct', label: 'Pickleball mix %', step: '0.01' },
      { key: 'usableCourtAreaPct', label: 'Usable court area %', step: '0.01' },
      { key: 'badmintonCourtSqft', label: 'Badminton court sf' },
      { key: 'pickleballCourtSqft', label: 'Pickleball court sf' },
    ],
  },
  {
    label: 'Revenue',
    fields: [
      { key: 'badmintonHourlyRate', label: 'Badminton $/hr' },
      { key: 'pickleballHourlyRate', label: 'Pickleball $/hr' },
      { key: 'badmintonReservedHoursPerWeek', label: 'Badminton hrs/wk' },
      { key: 'pickleballReservedHoursPerWeek', label: 'Pickleball hrs/wk' },
      { key: 'otherRevenuePct', label: 'Other revenue %', step: '0.01' },
    ],
  },
  {
    label: 'Operating expenses',
    fields: [
      { key: 'utilitiesPerSqftYr', label: 'Utilities $/sf/yr', step: '0.01' },
      { key: 'insurancePerSqftYr', label: 'Insurance $/sf/yr', step: '0.01' },
      { key: 'maintenancePerSqftYr', label: 'Maintenance $/sf/yr', step: '0.01' },
      { key: 'royaltyPct', label: 'Royalty %', step: '0.001' },
      { key: 'marketingPct', label: 'Marketing %', step: '0.001' },
      { key: 'miscAdminPct', label: 'Misc/Admin %', step: '0.001' },
    ],
  },
  {
    label: 'Payroll',
    fields: [
      { key: 'payrollHourlyRate', label: 'Payroll $/hr' },
      { key: 'payrollHoursPerWeek', label: 'Payroll hrs/wk' },
      { key: 'payrollBurden', label: 'Payroll burden ×', step: '0.01' },
    ],
  },
  {
    label: 'Renovation breakdown',
    fields: [
      { key: 'renovationHvacPerSqft', label: 'HVAC $/sf' },
      { key: 'renovationElectricalPerSqft', label: 'Electrical $/sf' },
      { key: 'renovationCourtLightingPerSqft', label: 'Court lighting $/sf (warehouse)' },
      { key: 'renovationPlumbingPerSqft', label: 'Plumbing $/sf' },
      { key: 'renovationCourtFlooringPerSqft', label: 'Court flooring $/sf (warehouse)' },
      { key: 'renovationWallsPerSqft', label: 'Walls & finishes $/sf' },
      { key: 'renovationOfficeBuildoutPerSqft', label: 'Office buildout $/sf' },
      { key: 'renovationBathroomCost', label: 'Bathroom $/each' },
      { key: 'renovationBathroomCount', label: '# of bathrooms' },
      { key: 'renovationCourtEquipmentPerCourt', label: 'Equipment $/court' },
      { key: 'renovationPermitsDesignPct', label: 'Permits & design % of subtotal', step: '0.01' },
      { key: 'renovationContingencyPct', label: 'Contingency % of subtotal', step: '0.01' },
      { key: 'franchiseFee', label: 'Franchise fee $' },
    ],
  },
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
      <DialogContent className="assumptions-dialog sm:max-w-3xl">
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
        <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-5">
          {groups.map((group) => (
            <section key={group.label}>
              <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                {group.label}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {group.fields.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{f.label}</Label>
                    <Input
                      type="number"
                      step={f.step}
                      value={value[f.key]}
                      onChange={(e) => onChange({ ...value, [f.key]: Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
