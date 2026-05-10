'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { PropertyRow } from '@/lib/supabase/types'

export async function listProperties(): Promise<PropertyRow[]> {
  const sb = await createSupabaseServerClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return []

  const { data, error } = await sb
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as PropertyRow[]
}
