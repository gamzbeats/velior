import Link from 'next/link'
import Image from 'next/image'
import { type Listing } from '@/lib/types'

const CONDITION_LABELS: Record<string, string> = {
  mint: 'Mint',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
}

interface ListingCardProps {
  listing: Listing
}

export default function ListingCard({ listing }: ListingCardProps) {
  const primaryImage = listing.images?.[0]
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(listing.price)

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden mb-4">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-muted-foreground/20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-3a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
            </svg>
          </div>
        )}

        {/* Condition badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase bg-background/90 backdrop-blur-sm px-2.5 py-1">
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">
          {listing.brand}
        </p>
        <h3 className="font-display text-lg font-medium leading-tight group-hover:underline underline-offset-2">
          {listing.model}
        </h3>
        {listing.year && (
          <p className="text-xs text-muted-foreground">{listing.year}</p>
        )}
        <p className="font-display text-xl font-semibold pt-1">{formattedPrice}</p>
      </div>
    </Link>
  )
}
