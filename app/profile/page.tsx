import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PlanBadge from '@/components/profile/PlanBadge'
import ListingManager from '@/components/profile/ListingManager'
import SellerOnboarding from '@/components/profile/SellerOnboarding'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { type SubscriptionTier } from '@/lib/types'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: listings }, { count: unreadCount }, { data: stripeAccount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('listings').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('read', false),
    supabase.from('stripe_accounts').select('payouts_enabled, stripe_connect_id').eq('user_id', user.id).maybeSingle(),
  ])

  // On connect=success, sync status directly from Stripe (webhook may lag)
  const { connect } = await searchParams
  if (connect === 'success' && stripeAccount?.stripe_connect_id) {
    const account = await stripe.accounts.retrieve(stripeAccount.stripe_connect_id)
    await supabase
      .from('stripe_accounts')
      .update({
        payouts_enabled: account.payouts_enabled ?? false,
        charges_enabled: account.charges_enabled ?? false,
        kyc_status: account.individual?.verification?.status === 'verified' ? 'verified' : 'pending',
      })
      .eq('user_id', user.id)
    if (account.payouts_enabled) {
      stripeAccount.payouts_enabled = true
    }
  }

  const tier = (profile?.subscription_tier ?? 'free') as SubscriptionTier
  const activeListings = listings?.filter((l) => l.status === 'active') ?? []
  const totalViews = listings?.reduce((sum, l) => sum + (l.views ?? 0), 0) ?? 0
  const atFreeLimit = tier === 'free' && (listings?.length ?? 0) >= 2

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen">
        {/* Header */}
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">Account</p>
                  <PlanBadge tier={tier} />
                </div>
                <h1 className="font-display font-light" style={{ fontSize: 'clamp(2rem, 5vw, 5rem)' }}>
                  {profile?.full_name ?? user.email?.split('@')[0] ?? 'My Profile'}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">{user.email}</p>
              </div>
              <div className="flex items-center gap-4">
                {unreadCount ? (
                  <Link
                    href="/messages"
                    className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    Messages
                    <span className="bg-foreground text-background text-[10px] px-1.5 py-0.5 font-medium">
                      {unreadCount}
                    </span>
                  </Link>
                ) : (
                  <Link href="/messages" className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                    Messages
                  </Link>
                )}
                <Link
                  href="/sell"
                  className="bg-foreground text-background px-6 py-3 text-xs font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors"
                >
                  + New Listing
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-b border-border bg-card">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: listings?.length ?? 0, label: 'Total Listings' },
                { value: activeListings.length, label: 'Active' },
                { value: totalViews, label: 'Total Views' },
                { value: unreadCount ?? 0, label: 'Unread Messages' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-3xl font-light">{stat.value}</p>
                  <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
          {/* Seller payment setup */}
          <div className="mb-8">
            <SellerOnboarding payoutsEnabled={stripeAccount?.payouts_enabled ?? false} />
          </div>

          {/* Upgrade banner for free users at limit */}
          {atFreeLimit && (
            <div className="mb-8 border border-border bg-card px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                You&apos;ve reached your free listing limit <span className="text-foreground font-medium">(2/2)</span>.
                Upgrade to list unlimited watches.
              </p>
              <Link href="/pricing" className="text-xs font-medium tracking-[0.2em] uppercase border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors shrink-0">
                Upgrade to Pro
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-light">
              My Listings{' '}
              <span className="text-muted-foreground font-sans text-xl font-normal ml-2">
                {listings?.length ?? 0}
              </span>
            </h2>
            {!atFreeLimit && (
              <Link
                href="/sell"
                className="hidden md:inline-flex text-xs font-medium tracking-[0.2em] uppercase border-b border-foreground pb-0.5 hover:text-muted-foreground transition-colors"
              >
                + New Listing
              </Link>
            )}
          </div>

          <ListingManager listings={listings ?? []} />
        </div>
      </main>
      <Footer />
    </>
  )
}
