import { createClient } from '@/lib/supabase/server'

export default async function StatsBar() {
  const supabase = await createClient()

  const [{ count: listingsCount }, { count: sellersCount }] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { value: listingsCount ? `${listingsCount}+` : '—', label: 'Active Listings' },
    { value: sellersCount ? `${sellersCount}+` : '—', label: 'Verified Sellers' },
    { value: '€12M+', label: 'In Timepieces' },
  ]

  return (
    <section className="bg-foreground text-background">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-3 gap-8 md:gap-0 divide-x-0 md:divide-x md:divide-background/10">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center md:text-left md:px-16 first:pl-0 last:pr-0">
              <p
                className="font-display font-light text-background leading-none mb-2"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 6rem)' }}
              >
                {stat.value}
              </p>
              <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-background/40">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
