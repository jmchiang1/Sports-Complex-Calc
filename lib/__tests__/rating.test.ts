import { describe, it, expect } from 'vitest'
import { rateAnalysis } from '../rating'

const baseInput = {
  totalSqft: 15_000,
  rentPerSqftYr: 18,
  totalCourts: 6,
  noi: 250_000,
  noiMargin: 0.30,
  paybackYears: 2.0,
}

describe('rateAnalysis', () => {
  it('returns Incomplete when totalSqft missing', () => {
    expect(rateAnalysis({ ...baseInput, totalSqft: 0 })).toBe('Incomplete')
  })
  it('returns Incomplete when rent missing', () => {
    expect(rateAnalysis({ ...baseInput, rentPerSqftYr: null })).toBe('Incomplete')
  })
  it('returns Do Not Pursue when courts < 4', () => {
    expect(rateAnalysis({ ...baseInput, totalCourts: 3 })).toBe('Do Not Pursue')
  })
  it('returns Do Not Pursue when noi <= 0', () => {
    expect(rateAnalysis({ ...baseInput, noi: 0 })).toBe('Do Not Pursue')
  })
  it('returns Strong Candidate when payback ≤ 2.5 and margin ≥ 0.25', () => {
    expect(rateAnalysis(baseInput)).toBe('Strong Candidate')
  })
  it('still returns Strong Candidate when margin & payback are strong even with very high rent burden', () => {
    // This is the case the user flagged: high NOI + great payback + strong margin
    // should NOT be killed by a high rent share.
    expect(rateAnalysis({ ...baseInput, noi: 528_000, noiMargin: 0.346, paybackYears: 1.4 })).toBe(
      'Strong Candidate',
    )
  })
  it('returns Worth Investigating when payback ≤ 4 and margin ≥ 0.15', () => {
    expect(rateAnalysis({ ...baseInput, paybackYears: 3.5, noiMargin: 0.18 })).toBe(
      'Worth Investigating',
    )
  })
  it('returns Risky as the fallback', () => {
    expect(rateAnalysis({ ...baseInput, paybackYears: 6, noiMargin: 0.10 })).toBe('Risky')
  })
})
