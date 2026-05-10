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
