'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const BRANDS = [
  'Rolex',
  'Patek Philippe',
  'Audemars Piguet',
  'Cartier',
  'IWC',
  'Jaeger-LeCoultre',
  'Vacheron Constantin',
  'A. Lange & Söhne',
  'Omega',
  'Breitling',
]

export default function BrandCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.6
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <section className="border-b border-border py-16 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-8 flex items-center justify-between">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground">
          Browse by Maison
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            aria-label="Previous"
            className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Next"
            className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex items-center gap-0 overflow-x-auto"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {BRANDS.map((brand) => (
          <Link
            key={brand}
            href={`/listings?brand=${encodeURIComponent(brand)}`}
            className="font-display font-light whitespace-nowrap px-8 md:px-12 text-foreground/20 hover:text-foreground/70 transition-colors duration-300 shrink-0"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
          >
            {brand}
          </Link>
        ))}
      </div>
    </section>
  )
}
