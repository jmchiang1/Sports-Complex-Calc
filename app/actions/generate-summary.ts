'use server'

import Anthropic from '@anthropic-ai/sdk'
import type { AnalysisResult } from '@/types/analysis'
import { generateFallbackSummary } from '@/lib/summary-fallback'

const MODEL = 'claude-haiku-4-5-20251001'

const SUMMARY_SYSTEM = `You are an analyst for a Kotofit franchise scout.

Given a property analysis, produce a 3-5 sentence plain-English summary that:
- States the deal rating in plain English
- Mentions court counts and key numbers (gross revenue, NOI, payback)
- Calls out the most important risk flags
- Ends with a numbered "Next steps:" list of 3-5 concrete questions to ask the broker.

Be direct. No marketing fluff. No emoji. No bullet points except the numbered next-steps list.`

export interface SummaryResult {
  summary: string
  source: 'ai' | 'fallback'
}

export async function generateSummary(
  result: AnalysisResult,
  address: string | null,
): Promise<SummaryResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  const fallback = (): SummaryResult => ({
    summary: generateFallbackSummary({
      address,
      rating: result.rating,
      courts: result.courts,
      grossRevenue: result.revenue.gross,
      noi: result.noi,
      paybackYears: result.paybackYears,
      flags: result.riskFlags,
    }),
    source: 'fallback',
  })

  if (!apiKey) return fallback()

  try {
    const client = new Anthropic({ apiKey })
    const userPayload = {
      address,
      rating: result.rating,
      courts: result.courts,
      revenue: result.revenue,
      noi: result.noi,
      noiMargin: result.noiMargin,
      paybackYears: result.paybackYears,
      rentBurden: result.rentBurden,
      riskFlags: result.riskFlags.map(f => ({ id: f.id, title: f.title })),
    }

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: [
        { type: 'text', text: SUMMARY_SYSTEM, cache_control: { type: 'ephemeral' } },
      ] as any,
      messages: [{ role: 'user', content: JSON.stringify(userPayload, null, 2) }],
    })

    const textBlock = resp.content.find((b: any) => b.type === 'text') as any
    if (!textBlock || textBlock.type !== 'text' || !textBlock.text.trim()) return fallback()

    return { summary: textBlock.text, source: 'ai' }
  } catch {
    return fallback()
  }
}
