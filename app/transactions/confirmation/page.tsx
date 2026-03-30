import Link from 'next/link'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string; payment_intent_client_secret?: string; redirect_status?: string }>
}) {
  const { payment_intent, redirect_status } = await searchParams

  if (!payment_intent) redirect('/')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch transaction linked to this payment intent
  const { data: transaction } = await supabase
    .from('transactions')
    .select('*, listing:listings(title, brand, model, images)')
    .eq('stripe_payment_intent_id', payment_intent)
    .maybeSingle()

  const success = redirect_status === 'succeeded'

  const fmt = (cents: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg w-full space-y-10 py-24">
          {success ? (
            <>
              <div>
                <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
                  Order confirmed
                </p>
                <h1 className="font-display text-4xl font-medium leading-tight mb-4">
                  Payment secured
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your payment is held securely by VELIOR. The seller has been notified and must ship within 3 business days.
                  You will be able to confirm receipt once the watch arrives.
                </p>
              </div>

              {transaction && (
                <div className="border border-border p-6 space-y-4">
                  <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">
                    Order summary
                  </p>
                  <div className="flex items-center gap-4">
                    {transaction.listing?.images?.[0] && (
                      <img
                        src={transaction.listing.images[0]}
                        alt=""
                        className="w-16 h-16 object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {transaction.listing?.brand} {transaction.listing?.model}
                      </p>
                      <p className="text-xs text-muted-foreground">{transaction.listing?.title}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Watch price</span>
                      <span>{fmt(transaction.amount_net + transaction.commission)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform fee</span>
                      <span>{fmt(transaction.commission)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t border-border pt-2 mt-2">
                      <span>Total paid</span>
                      <span>{fmt(transaction.amount_gross)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border border-border p-6 space-y-3">
                <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">
                  What happens next
                </p>
                {[
                  'The seller ships the watch via DHL, FedEx or UPS',
                  'You receive a tracking number by message',
                  'Inspect the watch upon arrival',
                  'Confirm receipt — funds are released to the seller',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Link
                  href="/profile"
                  className="flex-1 bg-foreground text-background px-6 py-3 text-xs font-medium tracking-[0.2em] uppercase text-center hover:opacity-90 transition-opacity"
                >
                  My account
                </Link>
                <Link
                  href="/listings"
                  className="flex-1 border border-border px-6 py-3 text-xs font-medium tracking-[0.2em] uppercase text-center hover:bg-muted transition-colors"
                >
                  Continue browsing
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl font-medium">Payment failed</h1>
              <p className="text-sm text-muted-foreground">
                Your payment could not be processed. You have not been charged.
              </p>
              <Link
                href="/listings"
                className="inline-block bg-foreground text-background px-6 py-3 text-xs font-medium tracking-[0.2em] uppercase hover:opacity-90 transition-opacity"
              >
                Back to listings
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
