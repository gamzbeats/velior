import Link from 'next/link'

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
  return (
    <section className="border-b border-border py-16 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-8">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground">
          Browse by Maison
        </p>
      </div>
      <div
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
