import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { type SubscriptionTier, TIER_CONFIG } from '@/lib/types'

const FEATURES: { label: string; free: boolean | string; pro: boolean | string; elite: boolean | string }[] = [
  { label: 'Active listings', free: '2 max', pro: 'Unlimited', elite: 'Unlimited' },
  { label: 'Saved favorites', free: '5 max', pro: 'Unlimited', elite: 'Unlimited' },
  { label: 'Seller contacts / month', free: '3 max', pro: 'Unlimited', elite: 'Unlimited' },
  { label: 'Verified Seller badge', free: false, pro: true, elite: true },
  { label: 'Listing analytics (views)', free: false, pro: true, elite: true },
  { label: 'Priority placement in search', free: false, pro: true, elite: true },
  { label: 'Featured listing slots', free: false, pro: false, elite: true },
  { label: 'Price history & market data', free: false, pro: false, elite: true },
  { label: 'Authentication service', free: false, pro: false, elite: true },
  { label: 'Dedicated advisor', free: false, pro: false, elite: true },
  { label: 'VELIOR Certified badge', free: false, pro: false, elite: true },
]

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-foreground text-base leading-none">✓</span>
  if (value === false) return <span className="text-muted-foreground/30 text-base leading-none">—</span>
  return <span className="text-sm font-medium">{value}</span>
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userTier: SubscriptionTier = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    userTier = (profile?.subscription_tier ?? 'free') as SubscriptionTier
  }

  const tiers: { key: SubscriptionTier; config: typeof TIER_CONFIG[SubscriptionTier] }[] = [
    { key: 'free', config: TIER_CONFIG.free },
    { key: 'pro', config: TIER_CONFIG.pro },
    { key: 'elite', config: TIER_CONFIG.elite },
  ]

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen">
        {/* Header */}
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-20">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground mb-4">
              Plans & Pricing
            </p>
            <h1 className="font-display font-light leading-tight" style={{ fontSize: 'clamp(2.5rem, 7vw, 7rem)' }}>
              Choose Your<br /><em>Tier.</em>
            </h1>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border mb-20">
            {tiers.map(({ key, config }) => {
              const isCurrent = userTier === key
              const isPro = key === 'pro'

              return (
                <div
                  key={key}
                  className={`p-8 md:p-10 flex flex-col border-b md:border-b-0 md:border-r border-border last:border-r-0 last:border-b-0 ${
                    isPro ? 'bg-foreground text-background' : 'bg-background text-foreground'
                  }`}
                >
                  <div className="mb-8">
                    <p className={`text-[10px] font-medium tracking-[0.3em] uppercase mb-3 ${isPro ? 'text-background/50' : 'text-muted-foreground'}`}>
                      {key.toUpperCase()}
                    </p>
                    <p className="font-display font-light leading-none mb-2" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
                      {config.name}
                    </p>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="font-display text-5xl font-light">
                        {config.price === 0 ? 'Free' : `€${config.price}`}
                      </span>
                      {config.price > 0 && (
                        <span className={`text-sm ${isPro ? 'text-background/50' : 'text-muted-foreground'}`}>/month</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1" />

                  {isCurrent ? (
                    <div className={`w-full py-3 text-xs font-medium tracking-[0.2em] uppercase text-center border ${
                      isPro ? 'border-background/30 text-background/50' : 'border-border text-muted-foreground'
                    }`}>
                      Current Plan
                    </div>
                  ) : key === 'free' ? (
                    user ? (
                      <div className={`w-full py-3 text-xs font-medium tracking-[0.2em] uppercase text-center border border-border text-muted-foreground`}>
                        Free Plan
                      </div>
                    ) : (
                      <Link
                        href="/register"
                        className="w-full py-3 text-xs font-medium tracking-[0.2em] uppercase text-center border border-foreground hover:bg-foreground hover:text-background transition-colors block"
                      >
                        Get Started
                      </Link>
                    )
                  ) : (
                    <Link
                      href="/pricing/checkout"
                      className={`w-full py-3 text-xs font-medium tracking-[0.2em] uppercase text-center transition-colors block ${
                        isPro
                          ? 'bg-background text-foreground hover:bg-background/90'
                          : 'bg-foreground text-background hover:bg-foreground/90'
                      }`}
                    >
                      {key === 'pro' ? 'Upgrade to Pro' : 'Go Elite'}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          {/* Feature matrix */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 pr-8 text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground w-1/2">
                    Feature
                  </th>
                  {tiers.map(({ key }) => (
                    <th key={key} className="py-4 text-center text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground w-[calc(50%/3)]">
                      {key === 'free' ? 'Collector' : key === 'pro' ? 'Seller' : 'Connoisseur'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature) => (
                  <tr key={feature.label} className="border-b border-border/50 hover:bg-card transition-colors">
                    <td className="py-4 pr-8 text-sm text-muted-foreground">{feature.label}</td>
                    <td className="py-4 text-center"><FeatureCell value={feature.free} /></td>
                    <td className="py-4 text-center"><FeatureCell value={feature.pro} /></td>
                    <td className="py-4 text-center"><FeatureCell value={feature.elite} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FAQ / note */}
          <div className="mt-20 pt-16 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">Why Upgrade?</p>
              <p className="font-display text-3xl font-light leading-tight mb-6">
                Sell faster.<br />Build trust.<br /><em>Get discovered.</em>
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pro and Elite sellers get priority placement in search results, a Verified Seller badge that builds buyer confidence, and detailed analytics to optimize their listings.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">Authentication</p>
              <p className="font-display text-3xl font-light leading-tight mb-6">
                VELIOR<br />Certified.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Elite members can request physical watch authentication by our expert team. Authenticated watches earn the &quot;VELIOR Certified&quot; badge and command a premium in the marketplace.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
