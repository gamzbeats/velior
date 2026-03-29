import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import FeaturedListings from '@/components/home/FeaturedListings'
import TrustSection from '@/components/home/TrustSection'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16">
        <Hero />
        <Suspense fallback={<div className="h-96 bg-background" />}>
          <FeaturedListings />
        </Suspense>
        <TrustSection />
      </main>
      <Footer />
    </>
  )
}
