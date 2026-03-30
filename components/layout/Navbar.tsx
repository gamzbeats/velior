'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Heart } from 'lucide-react'
import { signOut } from '@/lib/actions'
import NotificationBell from './NotificationBell'

interface NavbarProps {
  user?: { id: string; email?: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <nav className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="font-display text-2xl font-bold text-foreground" style={{ letterSpacing: '0.15em' }}>
          VELIOR
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10">
          <Link href="/listings" className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">Watches</Link>
          <Link href="/sell" className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">Sell</Link>
          <Link href="/pricing" className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link href="/#about" className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">About</Link>
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link href="/watchlist" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Watchlist">
                <Heart size={16} strokeWidth={1.5} />
              </Link>
              <NotificationBell userId={user.id} />
              <Link href="/messages" className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">Messages</Link>
              <Link href="/profile" className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">Profile</Link>
              <form action={signOut}>
                <button type="submit" className="text-xs font-medium tracking-[0.2em] uppercase border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors">Sign Out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/register" className="text-xs font-medium tracking-[0.2em] uppercase bg-foreground text-background px-5 py-2.5 hover:bg-foreground/90 transition-colors">Join</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          style={{ alignItems: 'center', justifyContent: 'center', width: 44, height: 44, cursor: 'pointer' }}
          className="flex md:hidden"
        >
          {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
        </button>

      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-5">
          <Link href="/listings" onClick={() => setOpen(false)} className="text-sm font-medium tracking-[0.2em] uppercase">Watches</Link>
          <Link href="/sell" onClick={() => setOpen(false)} className="text-sm font-medium tracking-[0.2em] uppercase">Sell</Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className="text-sm font-medium tracking-[0.2em] uppercase">Pricing</Link>
          {user ? (
            <>
              <Link href="/watchlist" onClick={() => setOpen(false)} className="text-sm font-medium tracking-[0.2em] uppercase">Watchlist</Link>
              <Link href="/messages" onClick={() => setOpen(false)} className="text-sm font-medium tracking-[0.2em] uppercase">Messages</Link>
              <Link href="/profile" onClick={() => setOpen(false)} className="text-sm font-medium tracking-[0.2em] uppercase">Profile</Link>
              <form action={signOut}><button type="submit" className="text-sm font-medium tracking-[0.2em] uppercase text-left w-full">Sign Out</button></form>
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
