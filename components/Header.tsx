import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { SignInDialog } from './SignInDialog'
import { UserMenu } from './UserMenu'

export async function Header() {
  let user = null
  try {
    const sb = await createSupabaseServerClient()
    const r = await sb.auth.getUser()
    user = r.data.user
  } catch {
    // no Supabase configured — render unauthenticated state
  }

  return (
    <header className="app-header sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-[95vw] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative inline-flex h-7 w-7 items-center justify-center">
            <Image
              src="/kotofit-logo.png"
              alt="Kotofit"
              width={28}
              height={28}
              priority
              className="rounded-md ring-1 ring-white/10 group-hover:ring-white/25 transition"
            />
          </span>
          <span className="font-semibold tracking-tight text-foreground">
            Kotofit <span className="text-muted-foreground font-normal">Facility Analyzer</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {user?.email ? (
            <UserMenu email={user.email} />
          ) : (
            <SignInDialog>
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </SignInDialog>
          )}
        </div>
      </div>
    </header>
  )
}
