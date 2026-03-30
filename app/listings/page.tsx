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
const MOVEMENTS = ['Automatic', 'Manual', 'Quartz']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'most_viewed', label: 'Most viewed' },
]

interface SearchParams {
  brand?: string
  condition?: string
  min?: string
  max?: string
  q?: string
  sort?: string
  movement?: string
  year_min?: string
  year_max?: string
  size_min?: string
  size_max?: string
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sort = params.sort ?? 'newest'

  let query = supabase
    .from('listings')
    .select('*, seller:profiles(*)')
    .eq('status', 'active')

  // Sorting
  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else if (sort === 'most_viewed') query = query.order('views', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  // Filters
  if (params.brand) query = query.eq('brand', params.brand)
  if (params.condition) query = query.eq('condition', params.condition)
  if (params.min) query = query.gte('price', parseFloat(params.min))
  if (params.max) query = query.lte('price', parseFloat(params.max))
  if (params.q) query = query.or(`title.ilike.%${params.q}%,brand.ilike.%${params.q}%,model.ilike.%${params.q}%`)
  if (params.movement) query = query.ilike('movement', `%${params.movement}%`)
  if (params.year_min) query = query.gte('year', parseInt(params.year_min))
  if (params.year_max) query = query.lte('year', parseInt(params.year_max))
  if (params.size_min) query = query.gte('case_size', parseFloat(params.size_min))
  if (params.size_max) query = query.lte('case_size', parseFloat(params.size_max))

  const { data: listings } = await query

  // Fetch favorited listing IDs for the current user
  let favoritedIds = new Set<string>()
  if (user) {
    const { data: favs } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id)
    if (favs) favoritedIds = new Set(favs.map((f) => f.listing_id))
  }

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

                {/* Sort */}
                <div>
                  <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-3">
                    Sort by
                  </label>
                  <select
                    name="sort"
                    defaultValue={sort}
                    className="w-full border border-border bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors appearance-none cursor-pointer"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
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

                {/* Movement */}
                <div>
                  <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-3">
                    Movement
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="movement" value="" defaultChecked={!params.movement} className="accent-foreground" />
                      <span className="text-sm">All</span>
                    </label>
                    {MOVEMENTS.map((m) => (
                      <label key={m} className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="movement" value={m} defaultChecked={params.movement === m} className="accent-foreground" />
                        <span className="text-sm">{m}</span>
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

                {/* Year range */}
                <div>
                  <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-3">
                    Year
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="year_min"
                      defaultValue={params.year_min}
                      placeholder="From"
                      min="1900"
                      max="2026"
                      className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                    <span className="text-muted-foreground text-sm">–</span>
                    <input
                      type="number"
                      name="year_max"
                      defaultValue={params.year_max}
                      placeholder="To"
                      min="1900"
                      max="2026"
                      className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                </div>

                {/* Case size */}
                <div>
                  <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-3">
                    Case size (mm)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="size_min"
                      defaultValue={params.size_min}
                      placeholder="Min"
                      step="0.5"
                      className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                    <span className="text-muted-foreground text-sm">–</span>
                    <input
                      type="number"
                      name="size_max"
                      defaultValue={params.size_max}
                      placeholder="Max"
                      step="0.5"
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

                <a
                  href="/listings"
                  className="block w-full text-center py-2 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors border border-border"
                >
                  Reset
                </a>
              </form>
            </aside>

            {/* Results */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-10">
                <p className="text-sm text-muted-foreground">
                  {listings?.length ?? 0} {listings?.length === 1 ? 'result' : 'results'}
                </p>
              </div>
              <ListingGrid listings={listings ?? []} favoritedIds={favoritedIds} isLoggedIn={!!user} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
