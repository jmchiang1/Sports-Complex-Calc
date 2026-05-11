'use server'

import { extractWithOpenAI } from '@/lib/extract/openai'
import { parseListingWithRegex } from '@/lib/extract/regex-fallback'
import type { ExtractedListing } from '@/types/analysis'

export interface ExtractResult {
  listing: ExtractedListing
  source: 'ai' | 'regex'
  error?: string
}

export async function extractListing(rawText: string): Promise<ExtractResult> {
  if (!rawText.trim()) {
    return { listing: parseListingWithRegex(''), source: 'regex' }
  }

  // No API key configured — silently use the regex parser (no warning).
  if (!process.env.OPENAI_API_KEY) {
    return { listing: parseListingWithRegex(rawText), source: 'regex' }
  }

  try {
    const listing = await extractWithOpenAI(rawText)
    return { listing, source: 'ai' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return {
      listing: parseListingWithRegex(rawText),
      source: 'regex',
      error: `AI extraction failed: ${message}`,
    }
  }
}
