'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
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

  // Track whether the user has manually edited the textarea. We only prompt
  // before overwriting when the content is user-typed — not when it came from
  // a previous bookmarklet drop (which is already processed into the form).
  const editedRef = useRef(false)

  // Read text from #import= hash (bookmarklet drop point). Runs on mount AND
  // on hashchange so a reused tab (window.open with named target) also fires.
  useEffect(() => {
    const handleImport = () => {
      const hash = window.location.hash
      if (!hash.startsWith('#import=')) return

      let imported = ''
      try {
        imported = decodeURIComponent(hash.slice('#import='.length))
      } catch {
        return
      }

      // Strip the hash immediately so reloads / re-mounts don't replay it.
      window.history.replaceState(null, '', window.location.pathname + window.location.search)

      if (!imported.trim()) return

      // If the user was mid-edit, ask before clobbering their work.
      if (editedRef.current) {
        const ok = window.confirm(
          'A bookmarklet import is replacing the listing input you were editing. Continue?',
        )
        if (!ok) return
      }

      setText(imported)
      editedRef.current = false
      setWarning(null)
      setStatus(`Loaded ${imported.length.toLocaleString()} chars from bookmarklet — extracting…`)

      // Auto-extract immediately (skips URL-fetch path — bookmarklet content is already text).
      start(async () => {
        setPhase('extracting')
        const r = await extractListing(imported)
        if (r.source === 'regex' && r.error) setWarning(r.error)
        else setStatus(`Extracted ${imported.length.toLocaleString()} chars from bookmarklet.`)
        onExtracted(r.listing, r.source, r.error)
        setPhase('idle')
      })
    }

    handleImport()
    window.addEventListener('hashchange', handleImport)
    return () => window.removeEventListener('hashchange', handleImport)
    // onExtracted is intentionally not a dep — we want the closure captured at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          onChange={e => {
            setText(e.target.value)
            editedRef.current = true
          }}
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
          <span className="text-sm text-muted-foreground">
            {isUrl ? 'URL detected — will fetch and parse.' : 'or fill the form manually below.'}
          </span>
        </div>
        {status && !warning && (
          <p className="text-sm text-emerald-300 bg-emerald-400/10 ring-1 ring-emerald-400/20 rounded-md px-3 py-2">
            {status}
          </p>
        )}
        {warning && (
          <p className="text-sm text-amber-300 bg-amber-400/10 ring-1 ring-amber-400/20 rounded-md px-3 py-2">
            {warning}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
