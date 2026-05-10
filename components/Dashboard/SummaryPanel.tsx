'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Summary</CardTitle>
        <Button size="sm" variant="ghost" onClick={refresh} disabled={pending}>
          {pending ? 'Generating…' : source === 'ai' ? 'Regenerate' : 'Generate AI summary'}
        </Button>
      </CardHeader>
      <CardContent>
        {pending ? <Skeleton className="h-32 w-full" /> : <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{text}</pre>}
      </CardContent>
    </Card>
  )
}
