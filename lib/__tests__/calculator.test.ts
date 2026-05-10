import { describe, it, expect } from 'vitest'
import { calculateCourts } from '../calculator'
import { DEFAULT_ASSUMPTIONS } from '../constants'

describe('calculateCourts', () => {
  it('returns 3 badminton + 1 pickleball for 10,000 sf warehouse with default assumptions', () => {
    const result = calculateCourts(10_000, DEFAULT_ASSUMPTIONS)
    expect(result).toEqual({ badminton: 3, pickleball: 1, total: 4 })
  })

  it('returns all zeros when warehouseSqft is 0', () => {
    expect(calculateCourts(0, DEFAULT_ASSUMPTIONS)).toEqual({ badminton: 0, pickleball: 0, total: 0 })
  })

  it('returns 6 badminton + 2 pickleball for 16,000 sf warehouse', () => {
    // usable = 12,800; bad area = 7,680 / 1,250 = 6 ; pickle area = 5,120 / 1,800 = 2
    const result = calculateCourts(16_000, DEFAULT_ASSUMPTIONS)
    expect(result).toEqual({ badminton: 6, pickleball: 2, total: 8 })
  })
})

import { calculateRevenue } from '../calculator'

describe('calculateRevenue', () => {
  it('matches spec example for 3 badminton + 1 pickleball', () => {
    // bad: 3 * 45 * 42 * 52 = 294,840
    // pickle: 1 * 55 * 38 * 52 = 108,680
    // court: 403,520
    // other: 403,520 * 0.18 = 72,633.6
    // gross: 476,153.6
    const result = calculateRevenue({ badminton: 3, pickleball: 1, total: 4 }, DEFAULT_ASSUMPTIONS)
    expect(result.badminton).toBe(294_840)
    expect(result.pickleball).toBe(108_680)
    expect(result.other).toBeCloseTo(72_633.6, 5)
    expect(result.gross).toBeCloseTo(476_153.6, 5)
  })

  it('returns zeros for zero courts', () => {
    const result = calculateRevenue({ badminton: 0, pickleball: 0, total: 0 }, DEFAULT_ASSUMPTIONS)
    expect(result).toEqual({ badminton: 0, pickleball: 0, other: 0, gross: 0 })
  })
})

import { calculateExpenses } from '../calculator'

describe('calculateExpenses', () => {
  it('matches spec example: 12,500 sf @ $20/sf, gross $476,153.6', () => {
    const result = calculateExpenses({
      totalSqft: 12_500,
      rentPerSqftYr: 20,
      grossRevenue: 476_153.6,
      assumptions: DEFAULT_ASSUMPTIONS,
    })
    expect(result.rent).toBe(250_000)
    expect(result.payroll).toBeCloseTo(39_603.2, 5)        // 17 * 40 * 52 * 1.12
    expect(result.utilities).toBe(56_250)                   // 12,500 * 4.5
    expect(result.insurance).toBe(15_625)                   // 12,500 * 1.25
    expect(result.maintenance).toBe(28_125)                 // 12,500 * 2.25
    expect(result.royalty).toBeCloseTo(33_330.752, 5)       // gross * 0.07
    expect(result.marketing).toBeCloseTo(11_903.84, 5)      // gross * 0.025
    expect(result.miscAdmin).toBeCloseTo(9_523.072, 5)      // gross * 0.02
    expect(result.total).toBeCloseTo(444_360.864, 3)
  })

  it('handles missing rent as zero', () => {
    const result = calculateExpenses({
      totalSqft: 12_500,
      rentPerSqftYr: null,
      grossRevenue: 0,
      assumptions: DEFAULT_ASSUMPTIONS,
    })
    expect(result.rent).toBe(0)
  })
})

import { calculateStartupCost, calculatePaybackYears } from '../calculator'

describe('calculateStartupCost', () => {
  it('matches spec for 12,500 sf', () => {
    const r = calculateStartupCost(12_500, DEFAULT_ASSUMPTIONS)
    expect(r.low).toBe(12_500 * 18 + 40_000)   // 265,000
    expect(r.mid).toBe(12_500 * 28 + 40_000)   // 390,000
    expect(r.high).toBe(12_500 * 45 + 40_000)  // 602,500
  })
})

describe('calculatePaybackYears', () => {
  it('returns startupMid / noi when noi > 0', () => {
    expect(calculatePaybackYears(390_000, 100_000)).toBe(3.9)
  })
  it('returns null when noi is zero', () => {
    expect(calculatePaybackYears(390_000, 0)).toBeNull()
  })
  it('returns null when noi is negative', () => {
    expect(calculatePaybackYears(390_000, -1000)).toBeNull()
  })
})

import { calculateAnalysis } from '../calculator'
import { EMPTY_LISTING } from '../constants'

describe('calculateAnalysis (orchestrator)', () => {
  it('returns the spec example end-to-end (without rating/flags/summary, those come later)', () => {
    const result = calculateAnalysis({
      listing: {
        ...EMPTY_LISTING,
        address: '91-15 139th St',
        totalSqft: 12_500,
        warehouseSqft: 10_000,
        officeSqft: 2_500,
        clearHeight: 20,
        rentPerSqftYr: 20,
      },
      assumptions: DEFAULT_ASSUMPTIONS,
    })

    expect(result.courts).toEqual({ badminton: 3, pickleball: 1, total: 4 })
    expect(result.revenue.gross).toBeCloseTo(476_153.6, 3)
    expect(result.expenses.total).toBeCloseTo(444_360.864, 3)
    expect(result.noi).toBeCloseTo(31_792.736, 3)
    expect(result.noiMargin).toBeCloseTo(0.0668, 3)
    expect(result.rentBurden).toBeCloseTo(0.525, 3)
    expect(result.monthlyRent).toBeCloseTo(20_833.33, 2)
    expect(result.monthlyRevenue).toBeCloseTo(39_679.47, 2)
    expect(result.revenuePerSqft).toBeCloseTo(38.09, 2)
    expect(result.startupCost.mid).toBe(390_000)
    expect(result.paybackYears).toBeCloseTo(12.27, 2)
  })

  it('falls back to totalSqft when warehouseSqft is null', () => {
    const result = calculateAnalysis({
      listing: { ...EMPTY_LISTING, totalSqft: 10_000, warehouseSqft: null, rentPerSqftYr: 20 },
      assumptions: DEFAULT_ASSUMPTIONS,
    })
    expect(result.courts.total).toBeGreaterThan(0)
  })

  it('returns zero-revenue when totalSqft is null', () => {
    const result = calculateAnalysis({
      listing: { ...EMPTY_LISTING },
      assumptions: DEFAULT_ASSUMPTIONS,
    })
    expect(result.revenue.gross).toBe(0)
    expect(result.noi).toBeLessThanOrEqual(0)
  })
})
