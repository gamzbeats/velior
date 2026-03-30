import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ListingGrid from '@/components/listings/ListingGrid'
import { createClient } from '@/lib/supabase/server'

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const [{ data: listings }, { data: reviews }] = await Promise.all([
    supabase.from('listings').select('*, seller:profiles(*)').eq('seller_id', id).eq('status', 'active').order('created_at', { ascending: false }),
    supabase.from('reviews').select('rating, comment, created_at, reviewer_id').eq('seller_id', id).order('created_at', { ascending: false }),
  ])

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen">
        {/* Header */}
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-16 h-16 bg-muted flex items-center justify-center text-xl font-medium uppercase shrink-0">
                  {(profile.full_name ?? profile.username ?? '?')[0]}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {profile.verified && (
                      <span className="text-[10px] font-medium tracking-[0.2em] uppercase border border-foreground px-2.5 py-1">
                        Verified
                      </span>
                    )}
                  </div>
                  <h1 className="font-display text-4xl font-light leading-tight">
                    {profile.full_name ?? profile.username ?? 'Private Seller'}
                  </h1>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    {profile.location && <span>{profile.location}</span>}
                    <span>Member since {memberSince}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-8 shrink-0">
                <div>
                  <p className="font-display text-3xl font-light">{listings?.length ?? 0}</p>
                  <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mt-1">Active listings</p>
                </div>
                {avgRating && (
                  <div>
                    <p className="font-display text-3xl font-light text-[#B8973A]">★ {avgRating}</p>
                    <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mt-1">
                      {reviews!.length} review{reviews!.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-8 max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div className="border-t border-border">
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
              <h2 className="font-display text-2xl font-light mb-8">
                Reviews
                <span className="text-muted-foreground font-sans text-lg font-normal ml-3">{reviews.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((r, i) => (
                  <div key={i} className="border border-border p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#B8973A] tracking-wider">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Listings */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
          <h2 className="font-display text-2xl font-light mb-8">
            Available watches
            <span className="text-muted-foreground font-sans text-lg font-normal ml-3">
              {listings?.length ?? 0}
            </span>
          </h2>

          {listings && listings.length > 0 ? (
            <ListingGrid listings={listings} isLoggedIn={!!user} />
          ) : (
            <div className="py-16 text-center">
              <p className="font-display text-2xl font-light text-muted-foreground/40">No active listings</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
