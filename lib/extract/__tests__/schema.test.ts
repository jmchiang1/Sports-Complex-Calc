import { describe, it, expect } from 'vitest'
import { ExtractedListingSchema } from '../schema'

describe('ExtractedListingSchema', () => {
  it('accepts a fully-populated listing', () => {
    const result = ExtractedListingSchema.parse({
      address: '91-15 139th St',
      totalSqft: 12_500,
      warehouseSqft: 10_000,
      officeSqft: 2_500,
      clearHeight: 20,
      rentPerSqftYr: 18,
      zoning: 'M1-1',
      loading: '1 dock',
      parking: null,
      locationNotes: ['Near JFK'],
    })
    expect(result.totalSqft).toBe(12_500)
  })

  it('accepts an all-null listing', () => {
    const result = ExtractedListingSchema.parse({
      address: null,
      totalSqft: null,
      warehouseSqft: null,
      officeSqft: null,
      clearHeight: null,
      rentPerSqftYr: null,
      zoning: null,
      loading: null,
      parking: null,
      locationNotes: [],
    })
    expect(result.address).toBeNull()
  })

  it('rejects negative sqft', () => {
    expect(() =>
      ExtractedListingSchema.parse({
        address: null,
        totalSqft: -1,
        warehouseSqft: null,
        officeSqft: null,
        clearHeight: null,
        rentPerSqftYr: null,
        zoning: null,
        loading: null,
        parking: null,
        locationNotes: [],
      }),
    ).toThrow()
  })
})
