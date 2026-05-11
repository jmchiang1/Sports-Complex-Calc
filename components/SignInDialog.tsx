'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { signInWithMagicLink } from '@/app/actions/auth'

export function SignInDialog({ children }: { children: React.ReactNode }) {
  const [pending, start] = useTransition()
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <Dialog>
      <DialogTrigger render={children as React.ReactElement}></DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
        </DialogHeader>
        <form
          action={(fd) => {
            setError(null)
            start(async () => {
              const r = await signInWithMagicLink(fd)
              if ('error' in r && r.error) setError(r.error)
              else setSent(String(fd.get('email') ?? ''))
            })
          }}
          className="space-y-3"
        >
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required disabled={pending || !!sent} />
          {sent ? (
            <p className="text-sm text-emerald-300">Magic link sent to {sent}. Check your inbox.</p>
          ) : (
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Sending…' : 'Send magic link'}
            </Button>
          )}
          {error && <p className="text-sm text-rose-300">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  )
}
