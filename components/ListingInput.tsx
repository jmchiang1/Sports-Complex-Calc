'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { extractListing } from '@/app/actions/extract-listing'
import type { ExtractedListing } from '@/types/analysis'

interface Props {
  onExtracted: (listing: ExtractedListing, source: 'ai' | 'regex', error?: string) => void
}

export function ListingInput({ onExtracted }: Props) {
  const [text, setText] = useState('')
  const [pending, start] = useTransition()
  const [warning, setWarning] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listing input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={8}
          placeholder="Paste listing text from LoopNet, Crexi, broker email, etc..."
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
                const r = await extractListing(text)
                if (r.source === 'regex' && r.error) setWarning(r.error)
                onExtracted(r.listing, r.source, r.error)
              })
            }
          >
            {pending ? 'Extracting…' : 'Extract with AI'}
          </Button>
          <span className="text-sm text-slate-500">or fill the form manually below.</span>
        </div>
        {warning && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {warning} Used local parser — please double-check fields.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
