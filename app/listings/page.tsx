import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ListingGrid from '@/components/listings/ListingGrid'
import { createClient } from '@/lib/supabase/server'
import { type Condition } from '@/lib/types'

const BRANDS = ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'IWC', 'Jaeger-LeCoultre', 'Vacheron Constantin', 'A. Lange & Söhne', 'Cartier', 'Breitling']
const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'mint', label: 'Mint' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
]

interface SearchParams {
  brand?: string
  condition?: string
  min?: string
  max?: string
  q?: string
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('listings')
    .select('*, seller:profiles(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (params.brand) query = query.eq('brand', params.brand)
  if (params.condition) query = query.eq('condition', params.condition)
  if (params.min) query = query.gte('price', parseFloat(params.min))
  if (params.max) query = query.lte('price', parseFloat(params.max))
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const { data: listings } = await query

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen">
        {/* Page header */}
        <div className="border-b border-border bg-background">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Marketplace
            </p>
            <h1 className="font-display font-light" style={{ fontSize: 'clamp(2.5rem, 6vw, 6rem)' }}>
              All Watches
            </h1>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Filters sidebar */}
            <aside className="lg:w-60 shrink-0">
              <form className="space-y-10">
                {/* Search */}
                <div>
                  <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-3">
                    Search
                  </label>
                  <input
                    type="text"
                    name="q"
                    defaultValue={params.q}
                    placeholder="Brand, model…"
                    className="w-full border border-border bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-3">
                    Brand
                  </label>
                  <select
                    name="brand"
                    defaultValue={params.brand ?? ''}
                    className="w-full border border-border bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">All brands</option>
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Condition */}
                <div>
                  <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-3">
                    Condition
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="condition" value="" defaultChecked={!params.condition} className="accent-foreground" />
                      <span className="text-sm">All</span>
                    </label>
                    {CONDITIONS.map((c) => (
                      <label key={c.value} className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="condition" value={c.value} defaultChecked={params.condition === c.value} className="accent-foreground" />
                        <span className="text-sm">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-3">
                    Price (€)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="min"
                      defaultValue={params.min}
                      placeholder="Min"
                      className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                    <span className="text-muted-foreground text-sm">–</span>
                    <input
                      type="number"
                      name="max"
                      defaultValue={params.max}
                      placeholder="Max"
                      className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-foreground text-background py-3 text-xs font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors"
                >
                  Apply Filters
                </button>
              </form>
            </aside>

            {/* Results */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-10">
                <p className="text-sm text-muted-foreground">
                  {listings?.length ?? 0} {listings?.length === 1 ? 'result' : 'results'}
                </p>
              </div>
              <ListingGrid listings={listings ?? []} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
