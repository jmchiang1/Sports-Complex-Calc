'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Bookmark } from 'lucide-react'

/**
 * The bookmarklet source. When clicked on any listing page, it:
 *  1. Finds the page's main content (or falls back to body)
 *  2. Extracts plain text, trims, caps at 32 KB
 *  3. Opens our app in a new tab with the text in the URL hash
 *
 * Kept minified-ish so the resulting `href` is compact.
 */
function buildBookmarklet(origin: string): string {
  const src = `
    var s=document.querySelector('main')||document.querySelector('article')||document.querySelector('[role="main"]')||document.body;
    var t=(s.innerText||'').trim().replace(/\\n{3,}/g,'\\n\\n').slice(0,32000);
    if(!t){alert('No text found on this page.');return;}
    window.open(${JSON.stringify(origin)}+'/#import='+encodeURIComponent(t),'_blank');
  `.replace(/\s+/g, ' ').trim()
  return `javascript:(function(){${src}})()`
}

export function BookmarkletHelper() {
  const [origin, setOrigin] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  if (!origin) return null

  const href = buildBookmarklet(origin)

  return (
    <Card>
      <Collapsible open={open} onOpenChange={(next) => setOpen(next)}>
        <CardHeader>
          <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bookmark className="size-4" />
              Bookmarklet — for LoopNet & other sites that block server-side fetches
            </CardTitle>
            <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="text-sm space-y-3">
            <p className="text-slate-600">
              LoopNet (and other CRE sites) block automated fetchers at the network level. A bookmarklet
              runs in your own browser, so the site sees a normal user and doesn&apos;t block it.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>Make sure your browser&apos;s bookmarks bar is visible (View → Show Bookmarks Bar)</li>
              <li>
                Drag this link to your bookmarks bar:{' '}
                <a
                  href={href}
                  onClick={(e) => e.preventDefault()}
                  className="inline-block px-2 py-1 rounded bg-[#0a0f1c] text-white font-medium no-underline hover:bg-[#1f2937]"
                >
                  📌 Save to Kotofit
                </a>
              </li>
              <li>Open any listing page (LoopNet, Crexi, broker site, etc.)</li>
              <li>Click the bookmarklet — a new tab opens here with the page text pre-loaded</li>
              <li>Click <span className="font-medium">Extract with AI</span> to populate the form</li>
            </ol>
            <p className="text-xs text-slate-500">
              The bookmarklet URL is tied to <code className="px-1 py-0.5 rounded bg-slate-100">{origin}</code>.
              If you change where this app runs, you&apos;ll need to drag a fresh bookmarklet.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
