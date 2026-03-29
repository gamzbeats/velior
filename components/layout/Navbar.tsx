'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { signOut } from '@/lib/actions'

interface NavbarProps {
  user?: { email?: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <nav className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="font-display text-2xl font-bold tracking-[0.15em] text-foreground"
            style={{ letterSpacing: '0.15em' }}
          >
            VELIOR
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10">
          <Link
            href="/listings"
            className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Watches
          </Link>
          <Link
            href="/sell"
            className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Sell
          </Link>
          <Link
            href="/#about"
            className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link
                href="/profile"
                className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Profile
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-xs font-medium tracking-[0.2em] uppercase border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-medium tracking-[0.2em] uppercase bg-foreground text-background px-5 py-2.5 hover:bg-foreground/90 transition-colors"
              >
                Join
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-5">
          <Link href="/listings" onClick={() => setOpen(false)} className="text-sm font-medium tracking-[0.2em] uppercase">Watches</Link>
          <Link href="/sell" onClick={() => setOpen(false)} className="text-sm font-medium tracking-[0.2em] uppercase">Sell</Link>
          {user ? (
            <>
              <Link href="/profile" onClick={() => setOpen(false)} className="text-sm font-medium tracking-[0.2em] uppercase">Profile</Link>
              <form action={signOut}><button type="submit" className="text-sm font-medium tracking-[0.2em] uppercase text-left">Sign Out</button></form>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-medium tracking-[0.2em] uppercase">Sign In</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="text-sm font-medium tracking-[0.2em] uppercase">Join</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
