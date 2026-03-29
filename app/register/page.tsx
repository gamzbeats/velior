'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await signUp(formData)
    if (res?.error) { setError(res.error); setPending(false) }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-16">
        <Link href="/" className="font-display text-2xl font-bold tracking-[0.15em]">
          VELIOR
        </Link>
        <div>
          <h1 className="font-display font-light leading-tight mb-6" style={{ fontSize: 'clamp(3rem, 5vw, 5rem)' }}>
            Join the<br /><em>circle.</em>
          </h1>
          <p className="text-sm text-background/50 leading-relaxed max-w-xs">
            Create your account to buy and sell exceptional timepieces within a community of serious collectors.
          </p>
        </div>
        <p className="text-xs text-background/25 tracking-[0.15em]">
          © 2024 VELIOR
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden block font-display text-2xl font-bold tracking-[0.15em] mb-10">
            VELIOR
          </Link>

          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-2">
            New Account
          </p>
          <h2 className="font-display text-3xl font-medium mb-8">Create Account</h2>

          <form action={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">Full Name</label>
              <input type="text" name="full_name" required placeholder="Your full name"
                className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">Email</label>
              <input type="email" name="email" required placeholder="you@example.com"
                className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">Password</label>
              <input type="password" name="password" required placeholder="Min. 8 characters" minLength={8}
                className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={pending}
              className="w-full bg-foreground text-background py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50">
              {pending ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
