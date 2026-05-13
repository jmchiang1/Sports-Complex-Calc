import Anthropic from '@anthropic-ai/sdk'
import { ExtractedListingSchema } from '@/lib/extract/schema'
import { EXTRACT_SYSTEM_PROMPT } from '@/lib/extract/prompt'
import { parseListingWithRegex } from '@/lib/extract/regex-fallback'
import type { ExtractedListing } from '@/types/analysis'

/**
 * Edge runtime — Vercel hobby tier gives ~25s of wall time for streaming
 * responses, much more headroom than the 10s Node Serverless cap. Anthropic
 * SDK uses fetch under the hood so it works in this environment.
 */
export const runtime = 'edge'

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

interface ExtractResult {
  listing: ExtractedListing
  source: 'ai' | 'regex'
  error?: string
}

async function extractWithAnthropic(rawText: string, apiKey: string): Promise<ExtractedListing> {
  const client = new Anthropic({ apiKey, timeout: 20_000, maxRetries: 0 })

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    temperature: 0,
    system: [
      {
        type: 'text',
        text: EXTRACT_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ] as never,
    tools: [TOOL as never],
    tool_choice: { type: 'tool', name: 'extract_listing' },
    messages: [{ role: 'user', content: rawText }],
  })

  type ToolUseBlock = { type: 'tool_use'; input: unknown }
  const toolUse = response.content.find(
    (b: { type: string }) => b.type === 'tool_use',
  ) as ToolUseBlock | undefined
  if (!toolUse) throw new Error('Anthropic did not return a tool_use block')

  return ExtractedListingSchema.parse(toolUse.input) as ExtractedListing
}

export async function POST(request: Request): Promise<Response> {
  let body: { text?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text : ''

  if (!text.trim()) {
    const result: ExtractResult = { listing: parseListingWithRegex(''), source: 'regex' }
    return Response.json(result)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const result: ExtractResult = { listing: parseListingWithRegex(text), source: 'regex' }
    return Response.json(result)
  }

  try {
    const listing = await extractWithAnthropic(text, process.env.ANTHROPIC_API_KEY)
    const result: ExtractResult = { listing, source: 'ai' }
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    const result: ExtractResult = {
      listing: parseListingWithRegex(text),
      source: 'regex',
      error: `AI extraction failed: ${message}`,
    }
    return Response.json(result)
  }
}
