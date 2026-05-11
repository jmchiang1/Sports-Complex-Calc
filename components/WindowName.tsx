'use client'

import { useEffect } from 'react'

/**
 * Sets window.name so the bookmarklet can target this tab via
 * `window.open(url, name)` instead of always opening a new tab.
 */
export function WindowName({ name }: { name: string }) {
  useEffect(() => {
    window.name = name
  }, [name])
  return null
}
