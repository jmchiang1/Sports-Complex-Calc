'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles } from 'lucide-react'
import { generateSummary } from '@/app/actions/generate-summary'
import type { AnalysisResult } from '@/types/analysis'

interface Props {
  result: AnalysisResult
  address: string | null
}

export function SummaryPanel({ result, address }: Props) {
  const [text, setText] = useState<string>(result.summary)
  const [source, setSource] = useState<'ai' | 'fallback' | 'pending'>('pending')
  const [pending, start] = useTransition()

  useEffect(() => {
    setText(result.summary)
    setSource('fallback')
  }, [result.summary])

  const refresh = () =>
    start(async () => {
      const r = await generateSummary(result, address)
      setText(r.summary)
      setSource(r.source)
    })

  return (
    <div className="summary-card surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">Summary</h3>
          {source === 'ai' && (
            <span className="text-[10px] uppercase tracking-wider text-cyan-300 bg-cyan-400/10 ring-1 ring-cyan-400/20 px-1.5 py-0.5 rounded">
              AI
            </span>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={refresh} disabled={pending}>
          <Sparkles className="size-3.5 mr-1" />
          {pending ? 'Generating…' : source === 'ai' ? 'Regenerate' : 'AI summary'}
        </Button>
      </div>
      {pending ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-9/12" />
        </div>
      ) : (
        <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-muted-foreground">
          {text}
        </pre>
      )}
    </div>
  )
}
