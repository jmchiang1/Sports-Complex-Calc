'use server'

import OpenAI from 'openai'
import type { AnalysisResult } from '@/types/analysis'
import { generateFallbackSummary } from '@/lib/summary-fallback'

const MODEL = 'gpt-4o-mini'

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
  const apiKey = process.env.OPENAI_API_KEY

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
    const client = new OpenAI({ apiKey })
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

    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM },
        { role: 'user', content: JSON.stringify(userPayload, null, 2) },
      ],
    })

    const text = completion.choices[0]?.message?.content?.trim()
    if (!text) return fallback()

    return { summary: text, source: 'ai' }
  } catch {
    return fallback()
  }
}
