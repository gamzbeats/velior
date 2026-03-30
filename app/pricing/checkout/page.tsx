import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center py-32">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground mb-6">
            Coming Soon
          </p>
          <h1 className="font-display text-4xl font-light mb-6">
            Stripe integration<br /><em>in progress.</em>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-10">
            Subscription billing will be available shortly. In the meantime, contact us directly to unlock Pro or Elite access.
          </p>
          <Link
            href="/pricing"
            className="text-xs font-medium tracking-[0.2em] uppercase border-b border-foreground pb-0.5 hover:text-muted-foreground transition-colors"
          >
            ← Back to Pricing
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
