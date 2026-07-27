'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { PropertyRow } from '@/lib/supabase/types'

/**
 * Rows powering the "Try without an account" demo. Unlike listProperties (which
 * scopes to the signed-in user), this runs for signed-out visitors: the
 * "demo public read" RLS policy — scoped to a single showcase account's user_id
 * — is what limits the result to that one account's properties. No user_id is
 * passed or known client-side; the database is the filter.
 *
 * Returns [] (never throws) when Supabase isn't configured or the query fails —
 * AppHome falls back to the built-in DEMO_PROPERTIES so the demo is never empty.
 */
export async function listDemoProperties(): Promise<PropertyRow[]> {
  let sb
  try {
    sb = await createSupabaseServerClient()
  } catch {
    return []
  }

  const { data, error } = await sb
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as PropertyRow[]
}
