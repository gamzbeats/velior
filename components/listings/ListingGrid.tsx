import { type Listing } from '@/lib/types'
import ListingCard from './ListingCard'

interface ListingGridProps {
  listings: Listing[]
  title?: string
  favoritedIds?: Set<string>
  isLoggedIn?: boolean
}

export default function ListingGrid({ listings, title, favoritedIds, isLoggedIn = false }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-3xl text-muted-foreground/40 font-light">No listings yet</p>
      </div>
    )
  }

  return (
    <div>
      {title && (
        <h2 className="font-display font-light mb-12" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            favoritedIds={favoritedIds}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>
    </div>
  )
}
