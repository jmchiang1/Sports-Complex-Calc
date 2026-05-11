import 'server-only'
import OpenAI from 'openai'
import { ExtractedListingSchema } from './schema'
import { EXTRACT_SYSTEM_PROMPT } from './prompt'
import type { ExtractedListing } from '@/types/analysis'

const MODEL = 'gpt-4o-mini'

const SCHEMA = {
  type: 'object',
  properties: {
    address: { type: ['string', 'null'] },
    totalSqft: { type: ['number', 'null'] },
    warehouseSqft: { type: ['number', 'null'] },
    officeSqft: { type: ['number', 'null'] },
    clearHeight: { type: ['number', 'null'] },
    rentPerSqftYr: { type: ['number', 'null'] },
    zoning: { type: ['string', 'null'] },
    loading: { type: ['string', 'null'] },
    parking: { type: ['string', 'null'] },
    locationNotes: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'address', 'totalSqft', 'warehouseSqft', 'officeSqft', 'clearHeight',
    'rentPerSqftYr', 'zoning', 'loading', 'parking', 'locationNotes',
  ],
  additionalProperties: false,
} as const

export async function extractWithOpenAI(rawText: string): Promise<ExtractedListing> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const client = new OpenAI({ apiKey })

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: EXTRACT_SYSTEM_PROMPT },
      { role: 'user', content: rawText },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'extracted_listing',
        strict: true,
        schema: SCHEMA,
      },
    } as any,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('OpenAI returned empty content')

  return ExtractedListingSchema.parse(JSON.parse(content))
}
