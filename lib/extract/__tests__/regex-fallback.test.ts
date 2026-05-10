import { describe, it, expect } from 'vitest'
import { parseListingWithRegex } from '../regex-fallback'

const specExample = `91-15 139th St, Jamaica, NY 11435
12,500 SF industrial space available
10,000 SF warehouse + 2,500 SF dedicated office space
Clear Height: 20'
Rental Rate: Upon Request
Zoning: M1-1
1 drive-in bay, 1 interior dock door
Near Van Wyck Expressway, JFK Airport, E/J/Z trains and LIRR Jamaica`

describe('parseListingWithRegex', () => {
  it('extracts the spec example', () => {
    const r = parseListingWithRegex(specExample)
    expect(r.address).toMatch(/91-15 139th St/)
    expect(r.totalSqft).toBe(12_500)
    expect(r.warehouseSqft).toBe(10_000)
    expect(r.officeSqft).toBe(2_500)
    expect(r.clearHeight).toBe(20)
    expect(r.rentPerSqftYr).toBeNull()      // "Upon Request"
    expect(r.zoning).toBe('M1-1')
  })

  it('returns mostly nulls for empty input', () => {
    const r = parseListingWithRegex('')
    expect(r.totalSqft).toBeNull()
    expect(r.zoning).toBeNull()
  })

  it('parses dollar rent like "$24/SF/yr"', () => {
    const r = parseListingWithRegex('Rental Rate: $24/SF/yr')
    expect(r.rentPerSqftYr).toBe(24)
  })
})
