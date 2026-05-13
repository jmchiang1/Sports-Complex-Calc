'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DashboardTable } from '@/components/DashboardTable'
import { EditorSheet } from '@/components/EditorSheet'
import { VerdictModal } from '@/components/VerdictModal'
import { BookmarkletHelper } from '@/components/BookmarkletHelper'
import { listProperties } from '@/app/actions/list-properties'
import { deleteProperty } from '@/app/actions/delete-property'
import type { PropertyRow } from '@/lib/supabase/types'

type EditorState = { row?: PropertyRow; importedText?: string } | null

export default function Page() {
  const [rows, setRows] = useState<PropertyRow[]>([])
  const [editor, setEditor] = useState<EditorState>(null)
  const [viewing, setViewing] = useState<PropertyRow | null>(null)
  const [, startReload] = useTransition()

  const reload = useCallback(() => {
    startReload(async () => {
      const list = await listProperties()
      setRows(list)
    })
  }, [])

  // Initial load.
  useEffect(() => {
    reload()
  }, [reload])

  // Bookmarklet hash → open editor with imported text.
  // The EditorSheet's ListingInput reads the hash itself when it mounts and
  // auto-extracts. We just need to open the sheet so the ListingInput mounts.
  useEffect(() => {
    const handleImport = () => {
      if (window.location.hash.startsWith('#import=')) {
        setEditor({ row: undefined })
      }
    }
    handleImport()
    window.addEventListener('hashchange', handleImport)
    return () => window.removeEventListener('hashchange', handleImport)
  }, [])

  const handleDelete = (id: string) => {
    startReload(async () => {
      await deleteProperty(id)
      const list = await listProperties()
      setRows(list)
      // Close any open verdict for the just-deleted row.
      setViewing((cur) => (cur?.id === id ? null : cur))
    })
  }

  return (
    <main className="max-w-[95vw] mx-auto w-full px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All saved analyses. Click a row to view the verdict.
          </p>
        </div>
        <Button onClick={() => setEditor({ row: undefined })} className="gap-1.5">
          <Plus className="size-4" />
          Add property
        </Button>
      </div>

      <DashboardTable
        rows={rows}
        onView={(row) => setViewing(row)}
        onEdit={(row) => {
          setViewing(null)
          setEditor({ row })
        }}
        onDelete={handleDelete}
      />

      <VerdictModal
        property={viewing}
        onClose={() => setViewing(null)}
        onEdit={(row) => {
          setViewing(null)
          setEditor({ row })
        }}
        onDelete={handleDelete}
      />

      <EditorSheet
        initial={editor}
        onClose={() => setEditor(null)}
        onSaved={() => reload()}
      />

      <div className="mt-6 flex justify-start">
        <BookmarkletHelper />
      </div>
    </main>
  )
}
