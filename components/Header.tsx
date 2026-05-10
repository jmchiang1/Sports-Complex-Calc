import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { SignInDialog } from './SignInDialog'

export async function Header() {
  const sb = await createSupabaseServerClient()
  const { data: { user } } = await sb.auth.getUser()

  return (
    <header className="bg-[#0a0f1c] text-white border-b border-[#1f2937]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          Kotofit Facility Analyzer
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-slate-300 mr-2">{user.email}</span>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm" className="text-slate-200 hover:text-white">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <SignInDialog>
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-white">
                Sign in
              </Button>
            </SignInDialog>
          )}
        </div>
      </div>
    </header>
  )
}
