'use server'

import { extractWithAnthropic } from '@/lib/extract/anthropic'
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

  try {
    const listing = await extractWithAnthropic(rawText)
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
