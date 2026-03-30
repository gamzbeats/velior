import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ListingForm from '@/components/listings/ListingForm'
import { createClient } from '@/lib/supabase/server'

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('seller_id', user.id)
    .single()

  if (!listing) notFound()

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen">
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground mb-4">
              Edit Listing
            </p>
            <h1 className="font-display font-light" style={{ fontSize: 'clamp(2rem, 5vw, 5rem)' }}>
              {listing.brand} {listing.model}
            </h1>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
          <div className="max-w-3xl">
            <ListingForm listing={listing} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
