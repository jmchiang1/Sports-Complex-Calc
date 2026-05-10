'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'email required' }

  const sb = await createSupabaseServerClient()
  const origin = (await headers()).get('origin') ?? 'http://localhost:3000'
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/api/auth/callback` },
  })
  if (error) return { error: error.message }
  return { ok: true }
}

export async function signOut() {
  const sb = await createSupabaseServerClient()
  await sb.auth.signOut()
  redirect('/')
}
