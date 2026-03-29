import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ListingForm from '@/components/listings/ListingForm'
import { createClient } from '@/lib/supabase/server'

export default async function SellPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/sell')

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen">
        {/* Header */}
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Seller Portal
            </p>
            <h1 className="font-display font-light" style={{ fontSize: 'clamp(2.5rem, 6vw, 6rem)' }}>
              List a Watch
            </h1>
            <p className="mt-4 text-sm text-muted-foreground max-w-lg">
              Your listing will be visible to thousands of serious collectors and enthusiasts. Provide accurate details and high-quality photos to attract the right buyers.
            </p>
          </div>
        </div>

        <div className="max-w-[900px] mx-auto px-6 md:px-12 py-20">
          <ListingForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
