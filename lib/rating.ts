import type { Rating } from '@/types/analysis'

export interface RatingInput {
  totalSqft: number | null
  rentPerSqftYr: number | null
  totalCourts: number
  noi: number
  noiMargin: number
  rentBurden: number
  paybackYears: number | null
}

export function rateAnalysis(i: RatingInput): Rating {
  if (!i.totalSqft || i.rentPerSqftYr == null) return 'Incomplete'
  if (i.totalCourts < 4 || i.noi <= 0 || i.rentBurden > 0.35) return 'Do Not Pursue'
  if (
    i.paybackYears !== null &&
    i.paybackYears <= 2.5 &&
    i.noiMargin >= 0.25 &&
    i.rentBurden <= 0.22
  ) {
    return 'Strong Candidate'
  }
  if (i.paybackYears !== null && i.paybackYears <= 4 && i.noiMargin >= 0.15) {
    return 'Worth Investigating'
  }
  return 'Risky'
}
