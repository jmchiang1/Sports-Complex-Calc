'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ExtractedListing } from '@/types/analysis'

interface Props {
  value: ExtractedListing
  onChange: (next: ExtractedListing) => void
}

const Field = (props: {
  label: string
  type?: 'text' | 'number'
  value: string | number | null
  onChange: (v: string | number | null) => void
  step?: string
}) => (
  <div>
    <Label className="text-xs text-slate-600">{props.label}</Label>
    <Input
      type={props.type ?? 'text'}
      step={props.step}
      value={props.value == null ? '' : props.value}
      onChange={e => {
        const v = e.target.value
        if (props.type === 'number') props.onChange(v === '' ? null : Number(v))
        else props.onChange(v === '' ? null : v)
      }}
    />
  </div>
)

export function PropertyForm({ value, onChange }: Props) {
  const set = <K extends keyof ExtractedListing>(k: K, v: ExtractedListing[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Address" value={value.address} onChange={v => set('address', v as string | null)} />
        <Field label="Zoning" value={value.zoning} onChange={v => set('zoning', v as string | null)} />
        <Field label="Total sq ft" type="number" value={value.totalSqft} onChange={v => set('totalSqft', v as number | null)} />
        <Field label="Warehouse sq ft" type="number" value={value.warehouseSqft} onChange={v => set('warehouseSqft', v as number | null)} />
        <Field label="Office sq ft" type="number" value={value.officeSqft} onChange={v => set('officeSqft', v as number | null)} />
        <Field label="Clear height (ft)" type="number" value={value.clearHeight} onChange={v => set('clearHeight', v as number | null)} />
        <Field label="Rent ($/sf/yr)" type="number" step="0.01" value={value.rentPerSqftYr} onChange={v => set('rentPerSqftYr', v as number | null)} />
        <Field label="Loading" value={value.loading} onChange={v => set('loading', v as string | null)} />
      </CardContent>
    </Card>
  )
}
