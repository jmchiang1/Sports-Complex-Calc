import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (code) {
    const sb = await createSupabaseServerClient()
    await sb.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/', url))
}
