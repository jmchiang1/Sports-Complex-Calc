'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Bookmark } from 'lucide-react'

function escapeHtmlAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * The bookmarklet source. When clicked on any listing page, it:
 *  1. Finds the page's main content (or falls back to body)
 *  2. Extracts plain text, trims, caps at 32 KB
 *  3. Opens our app in a new tab — falls back to same-tab nav if popups are blocked
 *  4. Surfaces any error via alert() so the user knows something happened
 *
 * Kept minified-ish so the resulting `href` is compact.
 */
function buildBookmarklet(origin: string): string {
  const src = `
    try{
      var s=document.querySelector('main')||document.querySelector('article')||document.querySelector('[role="main"]')||document.body;
      var t=(s.innerText||'').trim().replace(/\\n{3,}/g,'\\n\\n').slice(0,32000);
      if(!t){alert('Kotofit: no text found on this page.');return;}
      var u=${JSON.stringify(origin)}+'/#import='+encodeURIComponent(t);
      var w=window.open(u,'_blank');
      if(!w){if(confirm('Kotofit: popup blocked. Navigate this tab to the app?'))location.href=u;}
    }catch(e){alert('Kotofit error: '+(e&&e.message||e));}
  `.replace(/\s+/g, ' ').trim()
  return `javascript:(function(){${src}})()`
}

export function BookmarkletHelper() {
  const [origin, setOrigin] = useState('')
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const linkHostRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  // Suppress click on the in-app bookmarklet link — it's only for dragging.
  // (Clicking it would run the bookmarklet against our OWN page, which is junk.)
  useEffect(() => {
    const host = linkHostRef.current
    if (!host) return
    const handler = (e: Event) => {
      if ((e.target as HTMLElement)?.closest('a[data-bookmarklet]')) {
        e.preventDefault()
      }
    }
    host.addEventListener('click', handler)
    return () => host.removeEventListener('click', handler)
  }, [origin])

  if (!origin) return null

  const href = buildBookmarklet(origin)
  // React 19 sanitizes `javascript:` URLs out of <a href> at render time, which
  // breaks drag-to-bookmark. Inject the anchor as raw HTML to bypass that.
  const linkHtml =
    `<a href="${escapeHtmlAttr(href)}" data-bookmarklet ` +
    `class="inline-block px-2 py-1 rounded bg-primary text-primary-foreground ` +
    `font-medium no-underline hover:opacity-90 cursor-grab">📌 Save to Kotofit</a>`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

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
            <p className="text-muted-foreground">
              LoopNet (and other CRE sites) block automated fetchers at the network level. A bookmarklet
              runs in your own browser, so the site sees a normal user and doesn&apos;t block it.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-foreground/90">
              <li>Make sure your browser&apos;s bookmarks bar is visible (View → Show Bookmarks Bar)</li>
              <li>
                Drag this link to your bookmarks bar:{' '}
                <span ref={linkHostRef} dangerouslySetInnerHTML={{ __html: linkHtml }} />
              </li>
              <li>Open any listing page (LoopNet, Crexi, broker site, etc.)</li>
              <li>Click the bookmarklet — a new tab opens here with the page text pre-loaded</li>
              <li>Click <span className="font-medium">Extract with AI</span> to populate the form</li>
            </ol>

            <details className="rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium">
                Bookmarklet not working? Drag failed? Click here for the manual install.
              </summary>
              <div className="mt-2 space-y-2 text-xs">
                <p>If the drag didn&apos;t produce a bookmark with a <code className="px-1 rounded bg-black/30">javascript:</code> URL, browsers sometimes block that for security. Workaround:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Right-click an existing bookmark in your bar → <strong>Add page</strong> (or <strong>New bookmark</strong>)</li>
                  <li>Name: <code className="px-1 rounded bg-black/30">Save to Kotofit</code></li>
                  <li>URL: copy the full code below and paste into the URL field:</li>
                </ol>
                <div className="flex gap-2 items-start">
                  <textarea
                    readOnly
                    value={href}
                    rows={3}
                    className="flex-1 font-mono text-[10px] bg-black/30 ring-1 ring-white/10 rounded px-2 py-1.5 break-all"
                    onClick={e => (e.target as HTMLTextAreaElement).select()}
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 whitespace-nowrap"
                  >
                    {copied ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                <p className="text-muted-foreground">
                  After saving the bookmark, click it on any listing page. If you see no response, open
                  DevTools → Console and click again — any errors will appear there.
                </p>
              </div>
            </details>

            <p className="text-xs text-muted-foreground">
              The bookmarklet URL is tied to{' '}
              <code className="px-1 py-0.5 rounded bg-white/5 ring-1 ring-white/10">{origin}</code>.
              If you change where this app runs, you&apos;ll need to drag a fresh bookmarklet.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
