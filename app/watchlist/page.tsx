import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ListingGrid from '@/components/listings/ListingGrid'
import { createClient } from '@/lib/supabase/server'
import { type SubscriptionTier, type Listing } from '@/lib/types'

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: favorites }, { data: profile }] = await Promise.all([
    supabase
      .from('favorites')
      .select('*, listing:listings(*, seller:profiles(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('subscription_tier').eq('id', user.id).single(),
  ])

  const tier = (profile?.subscription_tier ?? 'free') as SubscriptionTier
  const listings = (favorites ?? []).map((f) => f.listing as Listing).filter(Boolean)
  const favoritedIds = new Set(listings.map((l) => l.id))
  const atLimit = tier === 'free' && listings.length >= 5

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen">
        {/* Header */}
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground mb-4">
              My Collection
            </p>
            <div className="flex items-end justify-between">
              <h1 className="font-display font-light" style={{ fontSize: 'clamp(2.5rem, 6vw, 7rem)' }}>
                Watchlist
              </h1>
              <p className="text-sm text-muted-foreground mb-2">
                {listings.length}{tier === 'free' ? ' / 5' : ''} saved
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
          {/* Free tier limit banner */}
          {atLimit && (
            <div className="mb-12 border border-border bg-card px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                You&apos;ve reached your watchlist limit <span className="text-foreground font-medium">(5/5)</span>.
                Upgrade to Pro for unlimited favorites.
              </p>
              <Link href="/pricing" className="text-xs font-medium tracking-[0.2em] uppercase border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors shrink-0">
                Upgrade
              </Link>
            </div>
          )}

          {listings.length === 0 ? (
            <div className="py-32 text-center">
              <p className="font-display text-4xl font-light text-muted-foreground/40 mb-6">
                No saved watches yet
              </p>
              <Link
                href="/listings"
                className="text-xs font-medium tracking-[0.2em] uppercase border-b border-foreground pb-0.5 hover:text-muted-foreground transition-colors"
              >
                Browse Watches
              </Link>
            </div>
          ) : (
            <ListingGrid
              listings={listings}
              favoritedIds={favoritedIds}
              isLoggedIn={true}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
