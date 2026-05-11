import type { Rating } from '@/types/analysis'

export interface RatingInput {
  totalSqft: number | null
  rentPerSqftYr: number | null
  totalCourts: number
  noi: number
  noiMargin: number
  paybackYears: number | null
}

/**
 * Deal rating gates:
 *   - Incomplete: no sqft or no rent given
 *   - Do Not Pursue: too few courts, or unprofitable
 *   - Strong Candidate: fast payback + healthy margin
 *   - Worth Investigating: decent payback + acceptable margin
 *   - Risky: everything else
 *
 * Note: rent burden is intentionally NOT a rating gate. It's a risk flag.
 * A property with strong NOI and fast payback is a good deal even if rent
 * happens to be a large share of revenue — the math still works.
 */
export function rateAnalysis(i: RatingInput): Rating {
  if (!i.totalSqft || i.rentPerSqftYr == null) return 'Incomplete'
  if (i.totalCourts < 4 || i.noi <= 0) return 'Do Not Pursue'
  if (i.paybackYears !== null && i.paybackYears <= 2.5 && i.noiMargin >= 0.25) {
    return 'Strong Candidate'
  }
  if (i.paybackYears !== null && i.paybackYears <= 4 && i.noiMargin >= 0.15) {
    return 'Worth Investigating'
  }
  return 'Risky'
}
