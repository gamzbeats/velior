import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ListingCard from '@/components/listings/ListingCard'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: listings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('listings').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
  ])

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen">
        {/* Header */}
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                  Account
                </p>
                <h1 className="font-display font-light" style={{ fontSize: 'clamp(2rem, 5vw, 5rem)' }}>
                  {profile?.full_name ?? user.email?.split('@')[0] ?? 'My Profile'}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">{user.email}</p>
              </div>
              <Link
                href="/sell"
                className="hidden md:inline-flex bg-foreground text-background px-6 py-3 text-xs font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors"
              >
                + New Listing
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-display text-3xl font-light">
              My Listings <span className="text-muted-foreground font-sans text-xl font-normal ml-2">{listings?.length ?? 0}</span>
            </h2>
            <Link
              href="/sell"
              className="md:hidden text-xs font-medium tracking-[0.2em] uppercase border-b border-foreground pb-0.5"
            >
              + New Listing
            </Link>
          </div>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border border-dashed border-border">
              <p className="font-display text-2xl text-muted-foreground/40 font-light mb-4">No listings yet</p>
              <Link href="/sell" className="text-xs font-medium tracking-[0.2em] uppercase border-b border-foreground pb-0.5">
                Create your first listing
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
