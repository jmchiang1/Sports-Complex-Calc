import type { Rating } from '@/types/analysis'

const styles: Record<Rating, string> = {
  'Strong Candidate': 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30',
  'Worth Investigating': 'bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/30',
  'Risky': 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30',
  'Do Not Pursue': 'bg-rose-400/15 text-rose-300 ring-1 ring-rose-400/30',
  'Incomplete': 'bg-white/10 text-muted-foreground ring-1 ring-white/15',
}

export function RatingBadge({ rating }: { rating: Rating }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${styles[rating]}`}
    >
      {rating}
    </span>
  )
}
