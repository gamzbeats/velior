import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import BrandCarousel from '@/components/home/BrandCarousel'
import StatsBar from '@/components/home/StatsBar'
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
        <BrandCarousel />
        <Suspense fallback={<div className="h-32 bg-foreground" />}>
          <StatsBar />
        </Suspense>
        <Suspense fallback={<div className="h-96 bg-background" />}>
          <FeaturedListings />
        </Suspense>
        <TrustSection />
      </main>
      <Footer />
    </>
  )
}
