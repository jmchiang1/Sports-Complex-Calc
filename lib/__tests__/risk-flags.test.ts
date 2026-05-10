import { describe, it, expect } from 'vitest'
import { generateRiskFlags } from '../risk-flags'
import { EMPTY_LISTING } from '../constants'

const noFlags = {
  listing: {
    ...EMPTY_LISTING,
    totalSqft: 15_000,
    warehouseSqft: 15_000,
    officeSqft: 0,
    clearHeight: 28,
    rentPerSqftYr: 18,
    zoning: null,
  },
  totalCourts: 8,
  rentBurden: 0.18,
}

describe('generateRiskFlags', () => {
  it('returns no flags when nothing concerning', () => {
    expect(generateRiskFlags(noFlags)).toEqual([])
  })
  it('flags low-clear-height when below 24', () => {
    const flags = generateRiskFlags({ ...noFlags, listing: { ...noFlags.listing, clearHeight: 20 } })
    expect(flags.map(f => f.id)).toContain('low-clear-height')
  })
  it('flags missing-rent when rent is null', () => {
    const flags = generateRiskFlags({ ...noFlags, listing: { ...noFlags.listing, rentPerSqftYr: null } })
    expect(flags.map(f => f.id)).toContain('missing-rent')
  })
  it('flags too-few-courts when courts < 6', () => {
    const flags = generateRiskFlags({ ...noFlags, totalCourts: 4 })
    expect(flags.map(f => f.id)).toContain('too-few-courts')
  })
  it('flags high-rent-burden when burden > 0.30', () => {
    const flags = generateRiskFlags({ ...noFlags, rentBurden: 0.32 })
    expect(flags.map(f => f.id)).toContain('high-rent-burden')
  })
  it('flags office-space when officeSqft > 0', () => {
    const flags = generateRiskFlags({
      ...noFlags,
      listing: { ...noFlags.listing, officeSqft: 1_500 },
    })
    expect(flags.map(f => f.id)).toContain('office-space')
  })
  it('flags zoning whenever zoning is present', () => {
    const flags = generateRiskFlags({
      ...noFlags,
      listing: { ...noFlags.listing, zoning: 'M1-1' },
    })
    expect(flags.map(f => f.id)).toContain('zoning')
  })
})
