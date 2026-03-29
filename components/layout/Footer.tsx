import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div>
            <span className="font-display text-3xl font-bold tracking-[0.15em] text-background">
              VELIOR
            </span>
            <p className="mt-4 text-sm text-background/60 leading-relaxed max-w-xs">
              The curated marketplace for exceptional timepieces. Trust, authenticity, and precision — since 2024.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-background/40 mb-4">
              Marketplace
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/listings" className="text-sm text-background/70 hover:text-background transition-colors">Browse Watches</Link>
              <Link href="/sell" className="text-sm text-background/70 hover:text-background transition-colors">Sell a Watch</Link>
              <Link href="/register" className="text-sm text-background/70 hover:text-background transition-colors">Create Account</Link>
            </div>
          </div>

          {/* Trust */}
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-background/40 mb-4">
              Shipping Partners
            </p>
            <div className="flex flex-col gap-3">
              <span className="text-sm text-background/70">DHL Express</span>
              <span className="text-sm text-background/70">FedEx Priority</span>
              <span className="text-sm text-background/70">UPS Secure</span>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-xs text-background/40 tracking-[0.1em]">
            © 2024 VELIOR. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link href="#" className="text-xs text-background/40 hover:text-background/70 tracking-[0.1em] transition-colors">Privacy</Link>
            <Link href="#" className="text-xs text-background/40 hover:text-background/70 tracking-[0.1em] transition-colors">Terms</Link>
            <Link href="#" className="text-xs text-background/40 hover:text-background/70 tracking-[0.1em] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
