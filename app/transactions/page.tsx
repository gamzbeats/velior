import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import TransactionStatusBadge from '@/components/transactions/TransactionStatusBadge'
import ShipForm from '@/components/transactions/ShipForm'
import BuyerActions from '@/components/transactions/BuyerActions'
import ReviewForm from '@/components/transactions/ReviewForm'
import { createClient } from '@/lib/supabase/server'
import { type TransactionStatus } from '@/lib/types'

function fmt(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { tab } = await searchParams
  const activeTab = tab === 'selling' ? 'selling' : 'buying'

  // Fetch existing reviews by this user to know which transactions already have one
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('transaction_id')
    .eq('reviewer_id', user.id)
  const reviewedTxIds = new Set((existingReviews ?? []).map((r) => r.transaction_id))

  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      listing:listings(id, title, brand, model, images, price),
      buyer:profiles!transactions_buyer_id_fkey(id, full_name, username),
      seller:profiles!transactions_seller_id_fkey(id, full_name, username)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const buying = (transactions ?? []).filter((t) => t.buyer_id === user.id)
  const selling = (transactions ?? []).filter((t) => t.seller_id === user.id)
  const list = activeTab === 'buying' ? buying : selling

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen">
        {/* Header */}
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground mb-2">Account</p>
            <h1 className="font-display text-4xl font-light">My Orders</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="flex gap-8">
              {[
                { key: 'buying', label: `Purchases (${buying.length})` },
                { key: 'selling', label: `Sales (${selling.length})` },
              ].map(({ key, label }) => (
                <Link
                  key={key}
                  href={`/transactions?tab=${key}`}
                  className={`py-4 text-xs font-medium tracking-[0.2em] uppercase border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
          {list.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-3xl font-light text-muted-foreground/40 mb-6">
                No {activeTab === 'buying' ? 'purchases' : 'sales'} yet
              </p>
              <Link href="/listings" className="text-xs font-medium tracking-[0.2em] uppercase border-b border-foreground pb-0.5">
                Browse watches
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {list.map((tx) => {
                const isBuyer = tx.buyer_id === user.id
                const listing = tx.listing as { id: string; title: string; brand: string; model: string; images: string[]; price: number } | null
                const counterpart = isBuyer
                  ? (tx.seller as { full_name: string | null; username: string | null } | null)
                  : (tx.buyer as { full_name: string | null; username: string | null } | null)
                const counterpartLabel = counterpart?.full_name ?? counterpart?.username ?? 'Unknown'
                const status = tx.status as TransactionStatus

                const showShipForm = !isBuyer && status === 'awaiting_shipment'
                const showBuyerActions = isBuyer && (status === 'shipped' || status === 'delivered')

                return (
                  <div key={tx.id} className="border border-border p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* Watch image */}
                      <div className="relative w-20 h-20 bg-muted shrink-0 overflow-hidden">
                        {Array.isArray(listing?.images) && listing.images[0] ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.brand ?? ''}
                            fill
                            className="object-cover"
                            sizes="80px"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 bg-muted" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
                              {listing?.brand}
                            </p>
                            <p className="font-medium text-sm mt-0.5">
                              {listing?.model}
                              {listing?.title && listing.title !== listing.model && (
                                <span className="text-muted-foreground font-normal"> — {listing.title}</span>
                              )}
                            </p>
                          </div>
                          <TransactionStatusBadge status={status} />
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                              {isBuyer ? 'Paid' : 'Net payout'}
                            </p>
                            <p className="font-medium">
                              {isBuyer ? fmt(tx.amount_gross) : fmt(tx.amount_net)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                              {isBuyer ? 'Seller' : 'Buyer'}
                            </p>
                            <p>{counterpartLabel}</p>
                          </div>
                          {tx.tracking_number && (
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Tracking</p>
                              <p className="font-mono text-xs">{tx.carrier?.toUpperCase()} — {tx.tracking_number}</p>
                            </div>
                          )}
                          {tx.released_at && (
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Completed</p>
                              <p>{formatDate(tx.released_at)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Order date</p>
                            <p>{formatDate(tx.created_at)}</p>
                          </div>
                        </div>

                        {/* Seller: ship form */}
                        {showShipForm && <ShipForm transactionId={tx.id} />}

                        {/* Buyer: confirm + dispute */}
                        {showBuyerActions && <BuyerActions transactionId={tx.id} />}

                        {/* Buyer: leave a review after completion */}
                        {isBuyer && status === 'completed' && !reviewedTxIds.has(tx.id) && (
                          <ReviewForm transactionId={tx.id} />
                        )}

                        {/* Dispute notice */}
                        {status === 'disputed' && (
                          <p className="text-xs text-red-600 border border-red-200 px-3 py-2 mt-2">
                            A dispute is open on this order. VELIOR will contact you to resolve it.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
