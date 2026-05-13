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
  // Bookmarklet-supplied metadata. AI doesn't populate these; defaulted so
  // the Zod parse succeeds whether they're present in the AI output or not.
  sourceUrl: z.string().nullable().default(null),
  imageUrls: z.array(z.string()).default([]),
})

export type ExtractedListingFromAI = z.infer<typeof ExtractedListingSchema>
