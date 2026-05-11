'use client'

import { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RatingBadge } from '@/components/Dashboard/RatingBadge'
import { fmtMoney } from '@/lib/format'
import { ArrowUp, ArrowDown, ArrowUpDown, MoreVertical, Pencil, Trash2, Eye } from 'lucide-react'
import type { PropertyRow } from '@/lib/supabase/types'
import type { Rating } from '@/types/analysis'

type SortKey = 'label' | 'rating' | 'noi' | 'total_courts' | 'payback_years' | 'created_at'
type SortDir = 'asc' | 'desc'

const RATING_ORDER: Record<Rating, number> = {
  'Strong Candidate': 0,
  'Worth Investigating': 1,
  'Risky': 2,
  'Do Not Pursue': 3,
  'Incomplete': 4,
}

interface Props {
  rows: PropertyRow[]
  onView: (row: PropertyRow) => void
  onEdit: (row: PropertyRow) => void
  onDelete: (id: string) => void
}

export function DashboardTable({ rows, onView, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState<'all' | Rating>('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const filteredSorted = useMemo(() => {
    const needle = search.trim().toLowerCase()
    let out = rows
    if (needle) {
      out = out.filter((r) => {
        const hay = `${r.label ?? ''} ${r.address ?? ''}`.toLowerCase()
        return hay.includes(needle)
      })
    }
    if (ratingFilter !== 'all') {
      out = out.filter((r) => r.rating === ratingFilter)
    }
    const sign = sortDir === 'asc' ? 1 : -1
    out = [...out].sort((a, b) => {
      switch (sortKey) {
        case 'label': {
          const av = (a.label || a.address || '').toLowerCase()
          const bv = (b.label || b.address || '').toLowerCase()
          return av.localeCompare(bv) * sign
        }
        case 'rating': {
          const av = a.rating ? RATING_ORDER[a.rating as Rating] : 99
          const bv = b.rating ? RATING_ORDER[b.rating as Rating] : 99
          return (av - bv) * sign
        }
        case 'noi':
          return ((a.noi ?? -Infinity) - (b.noi ?? -Infinity)) * sign
        case 'total_courts':
          return ((a.total_courts ?? -1) - (b.total_courts ?? -1)) * sign
        case 'payback_years':
          return ((a.payback_years ?? Infinity) - (b.payback_years ?? Infinity)) * sign
        case 'created_at':
        default:
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * sign
      }
    })
    return out
  }, [rows, search, ratingFilter, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'label' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="dashboard-table space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search address or label…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={ratingFilter}
          onValueChange={(v) => setRatingFilter(v as 'all' | Rating)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Rating: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Rating: All</SelectItem>
            <SelectItem value="Strong Candidate">Strong Candidate</SelectItem>
            <SelectItem value="Worth Investigating">Worth Investigating</SelectItem>
            <SelectItem value="Risky">Risky</SelectItem>
            <SelectItem value="Do Not Pursue">Do Not Pursue</SelectItem>
            <SelectItem value="Incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
          {filteredSorted.length} {filteredSorted.length === 1 ? 'property' : 'properties'}
        </span>
      </div>

      <div className="surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Address / Label" active={sortKey === 'label'} dir={sortDir} onClick={() => toggleSort('label')} />
              <SortHeader label="Rating" active={sortKey === 'rating'} dir={sortDir} onClick={() => toggleSort('rating')} />
              <SortHeader label="NOI" active={sortKey === 'noi'} dir={sortDir} onClick={() => toggleSort('noi')} align="right" />
              <SortHeader label="Courts" active={sortKey === 'total_courts'} dir={sortDir} onClick={() => toggleSort('total_courts')} align="right" />
              <SortHeader label="Payback" active={sortKey === 'payback_years'} dir={sortDir} onClick={() => toggleSort('payback_years')} align="right" />
              <SortHeader label="Added" active={sortKey === 'created_at'} dir={sortDir} onClick={() => toggleSort('created_at')} align="right" />
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                  {rows.length === 0
                    ? 'No saved properties yet. Click "Add new property" to get started.'
                    : 'No properties match the current filters.'}
                </TableCell>
              </TableRow>
            )}
            {filteredSorted.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-white/[0.03]"
                onClick={() => onView(row)}
              >
                <TableCell className="font-medium max-w-md truncate">
                  {row.label || row.address || 'Untitled'}
                </TableCell>
                <TableCell>
                  {row.rating ? <RatingBadge rating={row.rating as Rating} /> : <span className="text-muted-foreground text-xs">—</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.noi != null ? fmtMoney(row.noi) : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.total_courts ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.payback_years != null ? `${Number(row.payback_years).toFixed(1)} yr` : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground text-xs">
                  {formatDate(row.created_at)}
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation() /* prevent row click when using menu */}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="sm" className="size-8 p-0">
                          <MoreVertical className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(row)}>
                        <Eye className="size-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(row)}>
                        <Pencil className="size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm(`Delete "${row.label || row.address || 'this property'}"?`)) {
                            onDelete(row.id)
                          }
                        }}
                        className="text-rose-300"
                      >
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = 'left',
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: 'left' | 'right'
}) {
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead className={align === 'right' ? 'text-right' : ''}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {label}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
}
