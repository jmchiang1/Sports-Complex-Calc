import type { Rating } from '@/types/analysis'

const styles: Record<Rating, string> = {
  'Strong Candidate': 'bg-[#dcfce7] text-[#166534]',
  'Worth Investigating': 'bg-[#fef3c7] text-[#92400e]',
  'Risky': 'bg-[#ffedd5] text-[#9a3412]',
  'Do Not Pursue': 'bg-[#fee2e2] text-[#991b1b]',
  'Incomplete': 'bg-[#f1f5f9] text-[#475569]',
}

export function RatingBadge({ rating }: { rating: Rating }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${styles[rating]}`}
    >
      {rating}
    </span>
  )
}
