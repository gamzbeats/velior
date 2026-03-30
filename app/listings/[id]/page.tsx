import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ImageGallery from '@/components/listings/ImageGallery'
import InquiryTabsClient from '@/components/listings/InquiryTabs'
import FavoriteButton from '@/components/listings/FavoriteButton'
import { createClient } from '@/lib/supabase/server'
import { incrementViews } from '@/lib/actions'

const CONDITION_LABELS: Record<string, string> = {
  mint: 'Mint — Unworn or pristine',
  excellent: 'Excellent — Minor wear only',
  good: 'Good — Normal wear',
  fair: 'Fair — Visible wear',
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, seller:profiles(*)')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  // Increment view counter (fire-and-forget)
  incrementViews(id)

  // Check if current user has favorited this listing
  let isFavorited = false
  if (user) {
    const { data: fav } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', id)
      .single()
    isFavorited = !!fav
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(listing.price)

  const specs = [
    { label: 'Brand', value: listing.brand },
    { label: 'Model', value: listing.model },
    { label: 'Year', value: listing.year?.toString() ?? null },
    { label: 'Reference', value: listing.reference_number },
    { label: 'Movement', value: listing.movement },
    { label: 'Case Size', value: listing.case_size ? `${listing.case_size}mm` : null },
    { label: 'Condition', value: CONDITION_LABELS[listing.condition] ?? listing.condition },
  ].filter((s) => s.value)

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-4">
            <nav className="flex items-center gap-3 text-xs text-muted-foreground tracking-wide">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link href="/listings" className="hover:text-foreground transition-colors">Watches</Link>
              <span>/</span>
              <span className="text-foreground">{listing.brand} {listing.model}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 xl:gap-24">
            {/* Left: Images */}
            <div className="relative">
              {/* Floating favorite button for desktop */}
              <div className="absolute top-4 right-4 z-10 hidden lg:block">
                <FavoriteButton
                  listingId={listing.id}
                  initialFavorited={isFavorited}
                  isLoggedIn={!!user}
                />
              </div>
              <ImageGallery
                images={listing.images ?? []}
                alt={`${listing.brand} ${listing.model}`}
              />
            </div>

            {/* Right: Info panel */}
            <div className="lg:sticky lg:top-24 self-start space-y-10">
              {/* Header */}
              <div>
                <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
                  {listing.brand}
                </p>
                <h1 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-4">
                  {listing.model}
                </h1>
                <div className="flex items-end justify-between gap-4">
                  <p className="font-display text-4xl font-light">{formattedPrice}</p>
                  {/* Mobile favorite */}
                  <div className="lg:hidden relative w-10 h-10">
                    <FavoriteButton
                      listingId={listing.id}
                      initialFavorited={isFavorited}
                      isLoggedIn={!!user}
                    />
                  </div>
                </div>
              </div>

              {/* Specs table */}
              <div className="border-t border-border pt-8">
                <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-5">
                  Specifications
                </p>
                <dl className="space-y-3">
                  {specs.map((s) => (
                    <div key={s.label} className="flex items-baseline justify-between gap-4 py-2 border-b border-border/50">
                      <dt className="text-xs text-muted-foreground tracking-wide">{s.label}</dt>
                      <dd className="text-sm font-medium text-right">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Description */}
              {listing.description && (
                <div className="border-t border-border pt-8">
                  <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Authenticity */}
              <div className="border-t border-border pt-8">
                <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">
                  Authenticity
                </p>
                <div className="space-y-2.5">
                  {listing.seller?.verified && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <span className="w-1.5 h-1.5 bg-foreground block shrink-0" />
                      Verified Seller
                    </div>
                  )}
                  {listing.reference_number && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 block shrink-0" />
                      Reference number documented
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 block shrink-0" />
                    <span>
                      VELIOR Authentication available{' '}
                      <Link href="/pricing" className="text-foreground underline underline-offset-2 hover:no-underline">
                        (Elite)
                      </Link>
                    </span>
                  </div>
                </div>
              </div>

              {/* Seller info */}
              <div className="border-t border-border pt-8">
                <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">
                  Seller
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-muted flex items-center justify-center text-xs font-medium uppercase">
                    {(listing.seller?.full_name ?? listing.seller?.username ?? '?')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {listing.seller?.full_name ?? listing.seller?.username ?? 'Private Seller'}
                    </p>
                    {listing.seller?.location && (
                      <p className="text-xs text-muted-foreground">{listing.seller.location}</p>
                    )}
                  </div>
                  {listing.seller?.verified && (
                    <span className="ml-auto text-[10px] font-medium tracking-[0.15em] uppercase border border-foreground px-2.5 py-1">
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs: Inquire / Offer */}
              <div className="border-t border-border pt-8">
                <InquiryTabsClient listingId={listing.id} recipientId={listing.seller_id} />
              </div>

              {/* Shipping trust */}
              <div className="border border-border p-6 bg-card">
                <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">
                  Secure Shipping
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  This watch ships via DHL Express, FedEx Priority, or UPS Secure — fully insured for its declared value.
                </p>
                <div className="flex gap-6 text-xs font-medium tracking-wide text-muted-foreground/60">
                  <span>DHL</span>
                  <span>FedEx</span>
                  <span>UPS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

