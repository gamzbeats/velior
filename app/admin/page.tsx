import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import TransactionStatusBadge from '@/components/transactions/TransactionStatusBadge'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function fmt(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: transactions },
    { data: disputes },
    { data: sellerAccounts },
    { data: allProfiles },
  ] = await Promise.all([
    service
      .from('transactions')
      .select(`
        *,
        listing:listings(id, title, brand, model),
        buyer:profiles!transactions_buyer_id_fkey(id, full_name, username),
        seller:profiles!transactions_seller_id_fkey(id, full_name, username)
      `)
      .order('created_at', { ascending: false })
      .limit(100),
    service
      .from('dispute_cases')
      .select(`
        *,
        transaction:transactions(id, amount_gross, amount_net, listing:listings(title, brand, model)),
        opener:profiles!dispute_cases_opened_by_fkey(id, full_name, username)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false }),
    service
      .from('stripe_accounts')
      .select('*, profile:profiles(id, full_name, username, email)')
      .order('created_at', { ascending: false }),
    service.from('profiles').select('id').limit(1000),
  ])

  const txList = transactions ?? []
  const disputeList = disputes ?? []
  const sellerList = sellerAccounts ?? []

  // Stats
  const totalVolume = txList.filter((t) => ['completed', 'disputed'].includes(t.status))
    .reduce((sum, t) => sum + (t.amount_gross ?? 0), 0)
  const totalCommission = txList.filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + ((t.amount_gross ?? 0) - (t.amount_net ?? 0)), 0)
  const openDisputes = disputeList.length
  const completedCount = txList.filter((t) => t.status === 'completed').length

  return (
    <>
      <Navbar user={user} isAdmin />
      <main className="pt-16 min-h-screen">
        {/* Header */}
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground mb-2">VELIOR</p>
            <h1 className="font-display text-4xl font-light">Admin Dashboard</h1>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 space-y-16">

          {/* Stats */}
          <section>
            <h2 className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground mb-6">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-border bg-border">
              {[
                { label: 'Total volume', value: fmt(totalVolume) },
                { label: 'Commission earned', value: fmt(totalCommission) },
                { label: 'Completed orders', value: completedCount.toString() },
                { label: 'Open disputes', value: openDisputes.toString(), highlight: openDisputes > 0 },
              ].map((stat) => (
                <div key={stat.label} className="bg-background px-6 py-8">
                  <p className={`font-display text-3xl font-light ${stat.highlight ? 'text-red-600' : ''}`}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mt-2">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Open disputes */}
          {disputeList.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-light mb-6">
                Open disputes
                <span className="text-red-600 font-sans text-lg font-normal ml-3">{disputeList.length}</span>
              </h2>
              <div className="space-y-4">
                {disputeList.map((d) => {
                  const tx = d.transaction as { id: string; amount_gross: number; amount_net: number; listing: { title: string; brand: string; model: string } | null } | null
                  const opener = d.opener as { full_name: string | null; username: string | null } | null
                  return (
                    <div key={d.id} className="border border-red-200 p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {tx?.listing?.brand} {tx?.listing?.model}
                            {tx?.listing?.title && <span className="text-muted-foreground font-normal"> — {tx.listing.title}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Opened by {opener?.full_name ?? opener?.username ?? 'Unknown'} · {formatDate(d.created_at)}
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">Reason:</span> {d.reason}
                          </p>
                          {d.description && (
                            <p className="text-xs text-muted-foreground max-w-xl">{d.description}</p>
                          )}
                          <div className="flex gap-4 mt-1 text-xs">
                            <span>Gross: <span className="font-medium">{fmt(tx?.amount_gross ?? 0)}</span></span>
                            <span>Net to seller: <span className="font-medium">{fmt(tx?.amount_net ?? 0)}</span></span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Link
                            href={`/admin/disputes?id=${d.id}&resolution=refund_buyer`}
                            className="px-4 py-2 text-xs font-medium tracking-[0.1em] uppercase border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                          >
                            Refund buyer
                          </Link>
                          <Link
                            href={`/admin/disputes?id=${d.id}&resolution=release_seller`}
                            className="px-4 py-2 text-xs font-medium tracking-[0.1em] uppercase bg-foreground text-background hover:opacity-90 transition-opacity"
                          >
                            Release to seller
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Seller accounts / KYC */}
          <section>
            <h2 className="font-display text-2xl font-light mb-6">
              Seller accounts
              <span className="text-muted-foreground font-sans text-lg font-normal ml-3">{sellerList.length}</span>
            </h2>
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Seller</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Stripe ID</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Payouts</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Since</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerList.map((s) => {
                    const p = s.profile as { full_name: string | null; username: string | null; email: string | null } | null
                    return (
                      <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">
                          {p?.full_name ?? p?.username ?? p?.email ?? 'Unknown'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.stripe_connect_id}</td>
                        <td className="px-4 py-3">
                          {s.payouts_enabled ? (
                            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-green-700 border border-green-200 px-2 py-0.5">Enabled</span>
                          ) : (
                            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-orange-600 border border-orange-200 px-2 py-0.5">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(s.created_at)}</td>
                      </tr>
                    )
                  })}
                  {sellerList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No seller accounts yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* All transactions */}
          <section>
            <h2 className="font-display text-2xl font-light mb-6">
              All transactions
              <span className="text-muted-foreground font-sans text-lg font-normal ml-3">{txList.length}</span>
            </h2>
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Watch</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Buyer</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Seller</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {txList.map((t) => {
                    const listing = t.listing as { title: string; brand: string; model: string } | null
                    const buyer = t.buyer as { full_name: string | null; username: string | null } | null
                    const seller = t.seller as { full_name: string | null; username: string | null } | null
                    return (
                      <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{listing?.brand}</p>
                          <p className="font-medium">{listing?.model}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{buyer?.full_name ?? buyer?.username ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{seller?.full_name ?? seller?.username ?? '—'}</td>
                        <td className="px-4 py-3 font-medium">{fmt(t.amount_gross ?? 0)}</td>
                        <td className="px-4 py-3">
                          <TransactionStatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(t.created_at)}</td>
                      </tr>
                    )
                  })}
                  {txList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No transactions yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
