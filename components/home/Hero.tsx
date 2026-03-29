import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative bg-foreground text-background overflow-hidden min-h-screen flex items-end">
      {/* Background grid decoration */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }} />

      <div className="relative w-full max-w-[1400px] mx-auto px-6 md:px-12 pb-20 pt-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
          {/* Left: Editorial headline */}
          <div>
            {/* Overline */}
            <p className="text-xs font-medium tracking-[0.35em] uppercase text-background/40 mb-8">
              Est. 2024 — Curated Luxury
            </p>

            {/* Giant headline */}
            <h1 className="font-display font-light leading-[0.88] mb-10" style={{ fontSize: 'clamp(4rem, 12vw, 11rem)' }}>
              THE<br />
              MARKET<br />
              <span className="italic">FOR</span><br />
              EXCEP-<br />
              TIONAL<br />
              TIME-<br />
              PIECES
            </h1>

            {/* Subtext + CTA row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8 mt-12">
              <p className="text-sm text-background/50 max-w-xs leading-relaxed">
                A trusted peer-to-peer marketplace for rare and prestigious watches.
                Every listing verified. Every transaction secure.
              </p>
              <div className="flex flex-col gap-3 shrink-0">
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

          {/* Right: Stats / editorial accent */}
          <div className="hidden lg:flex flex-col items-end gap-16">
            {/* Decorative marker */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-background/20" />
              <span className="text-xs tracking-[0.3em] uppercase text-background/30">Scroll to explore</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-x-16 gap-y-10 text-right">
              <div>
                <p className="font-display text-6xl font-light text-background/90">500+</p>
                <p className="text-xs tracking-[0.2em] uppercase text-background/35 mt-2">Listings</p>
              </div>
              <div>
                <p className="font-display text-6xl font-light text-background/90">40+</p>
                <p className="text-xs tracking-[0.2em] uppercase text-background/35 mt-2">Brands</p>
              </div>
              <div>
                <p className="font-display text-6xl font-light text-background/90">100%</p>
                <p className="text-xs tracking-[0.2em] uppercase text-background/35 mt-2">Verified</p>
              </div>
              <div>
                <p className="font-display text-6xl font-light text-background/90">3</p>
                <p className="text-xs tracking-[0.2em] uppercase text-background/35 mt-2">Carriers</p>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="w-full max-w-xs border-t border-background/10 pt-6">
              <p className="text-xs text-background/25 tracking-[0.15em] leading-relaxed">
                Secure shipping via DHL, FedEx & UPS.<br />
                Every watch ships with full insurance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
