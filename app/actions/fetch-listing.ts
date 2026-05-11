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
    // Detect Akamai / Cloudflare / WAF block pages — they return 200 OK with a
    // small "Access Denied" body. LoopNet does this aggressively.
    if (text.length < 1000 && /access denied|attention required|cloudflare|you don't have permission/i.test(text)) {
      return {
        error:
          'The site blocked our server-side fetch (LoopNet, Crexi, and similar use anti-bot defenses that reject data-center IPs). Use the "Save to Kotofit" bookmarklet shown below — it runs in your own browser, which the site already trusts.',
      }
    }
    return { text }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return { error: `Fetch failed: ${message}` }
  }
}
