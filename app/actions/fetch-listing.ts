'use server'

const URL_RE = /^https?:\/\/\S+$/

export interface FetchResult {
  text?: string
  error?: string
}

/**
 * Fetches a public listing URL via Jina Reader (https://r.jina.ai/),
 * which renders the page in a real browser and returns clean text.
 * Free tier handles ~200 requests/minute — plenty for hobby use.
 */
export async function fetchListingText(url: string): Promise<FetchResult> {
  const trimmed = url.trim()
  if (!URL_RE.test(trimmed)) {
    return { error: 'Input does not look like a URL.' }
  }

  try {
    const resp = await fetch(`https://r.jina.ai/${trimmed}`, {
      headers: { 'X-Return-Format': 'text' },
    })
    if (!resp.ok) {
      return { error: `Jina Reader returned ${resp.status} ${resp.statusText}` }
    }
    const text = await resp.text()
    if (!text.trim()) {
      return { error: 'Fetched page was empty.' }
    }
    return { text }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return { error: `Fetch failed: ${message}` }
  }
}
