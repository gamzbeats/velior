import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ContactForm from '@/components/listings/ContactForm'
import { createClient } from '@/lib/supabase/server'

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
            <div className="space-y-3">
              {/* Primary image */}
              <div className="relative aspect-square bg-muted overflow-hidden">
                {listing.images?.[0] ? (
                  <Image
                    src={listing.images[0]}
                    alt={`${listing.brand} ${listing.model}`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                    <svg className="w-24 h-24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-3a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {listing.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {listing.images.slice(1, 5).map((img: string, i: number) => (
                    <div key={i} className="relative aspect-square bg-muted overflow-hidden">
                      <Image src={img} alt={`View ${i + 2}`} fill className="object-cover" sizes="25vw" />
                    </div>
                  ))}
                </div>
              )}
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
                <p className="font-display text-4xl font-light">{formattedPrice}</p>
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

              {/* Seller info */}
              <div className="border-t border-border pt-8">
                <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">
                  Seller
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center text-xs font-medium uppercase">
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

              {/* Contact form */}
              <div className="border-t border-border pt-8">
                <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
                  Inquire About This Watch
                </p>
                <ContactForm listingId={listing.id} recipientId={listing.seller_id} />
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
