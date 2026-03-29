'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn, signInWithMagicLink } from '@/lib/actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [magicSuccess, setMagicSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')

  async function handlePasswordLogin(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await signIn(formData)
    if (res?.error) { setError(res.error); setPending(false) }
  }

  async function handleMagicLink(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await signInWithMagicLink(formData)
    if (res?.error) { setError(res.error); setPending(false) }
    else if (res?.success) { setMagicSuccess(res.success); setPending(false) }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-16">
        <Link href="/" className="font-display text-2xl font-bold tracking-[0.15em]">
          VELIOR
        </Link>
        <div>
          <h1 className="font-display font-light leading-tight mb-6" style={{ fontSize: 'clamp(3rem, 5vw, 5rem)' }}>
            Welcome<br /><em>back.</em>
          </h1>
          <p className="text-sm text-background/50 leading-relaxed max-w-xs">
            Access your account to manage your listings, track inquiries, and discover exceptional timepieces.
          </p>
        </div>
        <p className="text-xs text-background/25 tracking-[0.15em]">
          © 2024 VELIOR
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden block font-display text-2xl font-bold tracking-[0.15em] mb-10">
            VELIOR
          </Link>

          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-2">
            Account Access
          </p>
          <h2 className="font-display text-3xl font-medium mb-8">Sign In</h2>

          {/* Mode toggle */}
          <div className="flex gap-1 border border-border p-1 mb-8">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={`flex-1 py-2 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${mode === 'password' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode('magic')}
              className={`flex-1 py-2 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${mode === 'magic' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
            >
              Magic Link
            </button>
          </div>

          {magicSuccess ? (
            <div className="border border-border p-6 text-center">
              <p className="font-display text-xl mb-2">Check your inbox</p>
              <p className="text-sm text-muted-foreground">{magicSuccess}</p>
            </div>
          ) : mode === 'password' ? (
            <form action={handlePasswordLogin} className="space-y-5">
              <div>
                <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">Email</label>
                <input type="email" name="email" required placeholder="you@example.com"
                  className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">Password</label>
                <input type="password" name="password" required placeholder="••••••••"
                  className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={pending}
                className="w-full bg-foreground text-background py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50">
                {pending ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form action={handleMagicLink} className="space-y-5">
              <div>
                <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">Email</label>
                <input type="email" name="email" required placeholder="you@example.com"
                  className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={pending}
                className="w-full bg-foreground text-background py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50">
                {pending ? 'Sending…' : 'Send Magic Link'}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link href="/register" className="text-foreground font-medium hover:underline">
              Join VELIOR
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
