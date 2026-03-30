import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ListingGrid from '@/components/listings/ListingGrid'

export default async function FeaturedListings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: listings } = await supabase
    .from('listings')
    .select('*, seller:profiles(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6)

  if (!listings || listings.length === 0) return null

  let favoritedIds = new Set<string>()
  if (user) {
    const { data: favs } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id)
    if (favs) favoritedIds = new Set(favs.map((f) => f.listing_id))
  }

  return (
    <section className="py-28 md:py-40 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="flex items-end justify-between mb-16">
          <h2 className="font-display font-light leading-tight" style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}>
            Recent<br /><em>Listings</em>
          </h2>
          <Link
            href="/listings"
            className="text-xs font-medium tracking-[0.2em] uppercase border-b border-foreground pb-1 hover:border-muted-foreground hover:text-muted-foreground transition-colors"
          >
            View All
          </Link>
        </div>
        <ListingGrid listings={listings} favoritedIds={favoritedIds} isLoggedIn={!!user} />
      </div>
    </section>
  )
}
