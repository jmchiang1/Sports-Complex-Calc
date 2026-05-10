'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function deleteProperty(id: string) {
  const sb = await createSupabaseServerClient()
  const { error } = await sb.from('properties').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { ok: true }
}
