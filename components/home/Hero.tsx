import Link from 'next/link'
import SplineScene from './SplineScene'

export default function Hero() {
  return (
    <section className="relative bg-foreground text-background overflow-hidden min-h-screen">
      {/* Spline — inert = aucun descendant ne capte les events */}
      <div className="absolute inset-0 z-0 spline-bg">
        <SplineScene />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 bg-foreground/40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col justify-between min-h-screen py-20 pt-36">

        {/* Overline */}
        <p className="text-xs font-medium tracking-[0.35em] uppercase text-background/40">
          Est. 2024 — Curated Luxury
        </p>

        {/* Headline */}
        <div>
          <h1
            className="font-display font-light leading-[0.9] mb-12 w-full"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 9rem)' }}
          >
            THE MARKET FOR<br />
            EXCEPTIONAL<br />
            <span className="italic">TIMEPIECES.</span>
          </h1>

          {/* Bottom row: description + CTAs */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <p className="text-sm text-background/50 max-w-sm leading-relaxed">
              A trusted peer-to-peer marketplace for rare and prestigious watches.
              Every listing verified. Every transaction secure.
            </p>

            <div className="flex flex-row gap-4 shrink-0">
              <Link
                href="/listings"
                className="inline-flex items-center justify-center border border-background px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-background hover:text-foreground transition-colors"
              >
                Browse Watches
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center justify-center bg-background text-foreground px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-background/90 transition-colors"
              >
                Sell a Watch
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
