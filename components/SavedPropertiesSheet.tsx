'use client'

import { useEffect, useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { listProperties } from '@/app/actions/list-properties'
import { deleteProperty } from '@/app/actions/delete-property'
import { RatingBadge } from './Dashboard/RatingBadge'
import { fmtMoney } from '@/lib/format'
import type { PropertyRow } from '@/lib/supabase/types'
import type { Rating } from '@/types/analysis'

interface Props {
  onLoad: (row: PropertyRow) => void
}

export function SavedPropertiesSheet({ onLoad }: Props) {
  const [rows, setRows] = useState<PropertyRow[]>([])
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (open) start(async () => setRows(await listProperties()))
  }, [open])

  return (
    <Sheet open={open} onOpenChange={(next) => setOpen(next)}>
      <SheetTrigger render={<Button variant="outline" size="sm">Saved properties</Button>} />
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Saved properties</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {pending && <p className="text-sm text-slate-500">Loading…</p>}
          {!pending && rows.length === 0 && (
            <p className="text-sm text-slate-500">No saved properties yet. Sign in and click Save.</p>
          )}
          {rows.map(r => (
            <div key={r.id} className="border rounded-lg p-3 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm truncate">{r.label || r.address || 'Untitled'}</div>
                {r.rating && <RatingBadge rating={r.rating as Rating} />}
              </div>
              <div className="text-xs text-slate-500 tabular-nums mt-1">
                NOI {r.noi != null ? fmtMoney(r.noi) : '—'} · {r.total_courts ?? 0} courts ·{' '}
                {r.payback_years != null ? `${Number(r.payback_years).toFixed(1)} yr payback` : 'no payback'}
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="default" onClick={() => { onLoad(r); setOpen(false) }}>
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    start(async () => {
                      await deleteProperty(r.id)
                      setRows(rows.filter(x => x.id !== r.id))
                    })
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
