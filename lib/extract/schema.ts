import { z } from 'zod'

const nonNegativeNullableNumber = z.number().min(0).nullable()

export const ExtractedListingSchema = z.object({
  address: z.string().nullable(),
  totalSqft: nonNegativeNullableNumber,
  warehouseSqft: nonNegativeNullableNumber,
  officeSqft: nonNegativeNullableNumber,
  clearHeight: nonNegativeNullableNumber,
  rentPerSqftYr: nonNegativeNullableNumber,
  zoning: z.string().nullable(),
  loading: z.string().nullable(),
  parking: z.string().nullable(),
  locationNotes: z.array(z.string()).default([]),
})

export type ExtractedListingFromAI = z.infer<typeof ExtractedListingSchema>
