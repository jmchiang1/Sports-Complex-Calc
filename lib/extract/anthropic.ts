import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { ExtractedListingSchema } from './schema'
import { EXTRACT_SYSTEM_PROMPT } from './prompt'
import type { ExtractedListing } from '@/types/analysis'

const MODEL = 'claude-haiku-4-5-20251001'

const TOOL = {
  name: 'extract_listing',
  description: 'Extract structured property data from a commercial listing.',
  input_schema: {
    type: 'object' as const,
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
  },
} as const

export async function extractWithAnthropic(rawText: string): Promise<ExtractedListing> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  // 8s SDK-level timeout fits comfortably inside Vercel hobby's 10s function
  // timeout. If Anthropic stalls, we error out cleanly instead of being killed
  // and leaving the client connection to hang.
  const client = new Anthropic({ apiKey, timeout: 8_000, maxRetries: 0 })

  const response = await client.messages.create({
    model: MODEL,
    // The JSON we want is ~200 tokens; 400 leaves headroom without letting
    // Claude overgenerate.
    max_tokens: 400,
    // Deterministic + slightly faster sampling for structured output.
    temperature: 0,
    system: [
      {
        type: 'text',
        text: EXTRACT_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ] as any,
    tools: [TOOL as any],
    tool_choice: { type: 'tool', name: 'extract_listing' },
    messages: [{ role: 'user', content: rawText }],
  })

  const toolUse = response.content.find((b: any) => b.type === 'tool_use') as any
  if (!toolUse) {
    throw new Error('Anthropic did not return a tool_use block')
  }

  return ExtractedListingSchema.parse(toolUse.input)
}
