'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { extractListing } from '@/app/actions/extract-listing'
import { fetchListingText } from '@/app/actions/fetch-listing'
import type { ExtractedListing } from '@/types/analysis'

const URL_RE = /^https?:\/\/\S+$/

interface Props {
  onExtracted: (listing: ExtractedListing, source: 'ai' | 'regex', error?: string) => void
}

export function ListingInput({ onExtracted }: Props) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'fetching' | 'extracting'>('idle')
  const [pending, start] = useTransition()
  const [warning, setWarning] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  // Read text from the URL hash on mount (bookmarklet drop point).
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.startsWith('#import=')) return
    try {
      const imported = decodeURIComponent(hash.slice('#import='.length))
      if (imported.trim()) {
        setText(imported)
        setStatus(`Loaded ${imported.length.toLocaleString()} chars from bookmarklet. Click Extract to parse.`)
      }
    } catch {
      // ignore malformed hash
    }
    // Strip the hash so reloads / re-mounts don't replay it.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [])

  const isUrl = URL_RE.test(text.trim())

  const buttonLabel = pending
    ? phase === 'fetching'
      ? 'Fetching URL…'
      : 'Extracting…'
    : isUrl
      ? 'Fetch & Extract'
      : 'Extract with AI'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listing input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={8}
          placeholder="Paste a LoopNet/Crexi URL — or paste listing text directly..."
          value={text}
          onChange={e => setText(e.target.value)}
          className="font-mono text-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            disabled={pending || !text.trim()}
            onClick={() =>
              start(async () => {
                setWarning(null)
                setStatus(null)

                let payload = text
                if (isUrl) {
                  setPhase('fetching')
                  const f = await fetchListingText(text)
                  if (f.error || !f.text) {
                    setWarning(`URL fetch failed: ${f.error ?? 'no content'}`)
                    setPhase('idle')
                    return
                  }
                  payload = f.text
                  setStatus(`Fetched ${f.text.length.toLocaleString()} chars from URL.`)
                }

                setPhase('extracting')
                const r = await extractListing(payload)
                if (r.source === 'regex' && r.error) setWarning(r.error)
                onExtracted(r.listing, r.source, r.error)
                setPhase('idle')
              })
            }
          >
            {buttonLabel}
          </Button>
          <span className="text-sm text-slate-500">
            {isUrl ? 'URL detected — will fetch and parse.' : 'or fill the form manually below.'}
          </span>
        </div>
        {status && !warning && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            {status}
          </p>
        )}
        {warning && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {warning}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
