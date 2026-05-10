import type { Rating, RiskFlag } from '@/types/analysis'

export interface FallbackInput {
  address: string | null
  rating: Rating
  courts: { badminton: number; pickleball: number; total: number }
  grossRevenue: number
  noi: number
  paybackYears: number | null
  flags: RiskFlag[]
}

const fmtMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}K`

export function generateFallbackSummary(i: FallbackInput): string {
  const where = i.address ? `at ${i.address}` : 'this property'
  const article = i.rating.startsWith('S') || i.rating.startsWith('R') ? 'a' : 'a'
  const ratingLine = `This ${where ? 'property' : 'listing'} is ${article} ${i.rating} candidate for a Kotofit-style badminton/pickleball facility.`

  const courtLine =
    i.courts.total > 0
      ? `It supports an estimated ${i.courts.badminton} badminton and ${i.courts.pickleball} pickleball court(s) (${i.courts.total} total).`
      : 'Court count could not be determined from the inputs provided.'

  const noiLine =
    i.paybackYears !== null
      ? `Projected gross revenue is ${fmtMoney(i.grossRevenue)} with NOI of ${fmtMoney(i.noi)} and a ~${i.paybackYears.toFixed(1)} year payback.`
      : i.noi <= 0
        ? 'Not profitable under the current assumptions, so payback is unavailable.'
        : 'Payback period is unavailable.'

  const flagLines = i.flags.length
    ? `Risk flags: ${i.flags.map(f => f.title).join('; ')}.`
    : 'No major risk flags triggered.'

  const nextSteps = [
    '1. Confirm asking rent.',
    '2. Verify true clear height and ceiling obstructions.',
    '3. Confirm recreational use is allowed under zoning.',
    '4. Ask for floor plan and column spacing.',
    '5. Confirm parking count.',
  ].join('\n')

  return `${ratingLine}\n\n${courtLine} ${noiLine}\n\n${flagLines}\n\nNext steps:\n${nextSteps}`
}
