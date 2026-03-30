'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ── Inner checkout form (mounted inside <Elements>) ──────────────────────────

function CheckoutForm({
  amountGross,
  amountNet,
  commission,
  onClose,
}: {
  amountGross: number
  amountNet: number
  commission: number
  onClose: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fmt = (cents: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setErrorMsg(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/transactions/confirmation`,
      },
    })

    if (error) {
      setErrorMsg(error.message ?? 'Payment failed.')
      setSubmitting(false)
    }
    // On success Stripe redirects to return_url — no need to handle here
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Price breakdown */}
      <div className="border border-border p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Watch price</span>
          <span>{fmt(amountNet + commission)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Platform fee (8%)</span>
          <span>{fmt(commission)}</span>
        </div>
        <div className="flex justify-between font-medium border-t border-border pt-2 mt-2">
          <span>Total</span>
          <span>{fmt(amountGross)}</span>
        </div>
      </div>

      {/* Escrow notice */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        Your payment is held securely by VELIOR until you confirm receipt of the watch.
        Funds are only released to the seller after your approval.
      </p>

      <PaymentElement />

      {errorMsg && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-border px-4 py-3 text-sm font-medium tracking-wide hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !stripe}
          className="flex-1 bg-foreground text-background px-4 py-3 text-sm font-medium tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Processing…' : `Pay ${fmt(amountGross)}`}
        </button>
      </div>
    </form>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function CheckoutModal({
  listingId,
  onClose,
}: {
  listingId: string
  onClose: () => void
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<{ amountGross: number; commission: number; amountNet: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  // Create payment intent on mount
  useState(() => {
    fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setApiError(data.error)
        } else {
          setClientSecret(data.clientSecret)
          setAmounts({ amountGross: data.amountGross, commission: data.commission, amountNet: data.amountNet })
        }
        setLoading(false)
      })
      .catch(() => {
        setApiError('Unable to initialise payment. Please try again.')
        setLoading(false)
      })
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background border border-border w-full max-w-md p-8 space-y-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl font-medium">Secure Checkout</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground">Preparing secure payment…</p>
        )}

        {apiError && (
          <p className="text-sm text-red-600">{apiError}</p>
        )}

        {clientSecret && amounts && (
          <Elements
            stripe={stripePromise}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options={{
              clientSecret,
              appearance: {
                theme: 'flat',
                variables: {
                  colorBackground: '#F2F0EB',
                  colorText: '#0A0A0A',
                  borderRadius: '0px',
                  fontFamily: 'Space Grotesk, sans-serif',
                },
              },
            } as any}
          >
            <CheckoutForm {...amounts} onClose={onClose} />
          </Elements>
        )}
      </div>
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export default function BuyNowButton({
  listingId,
  isLoggedIn,
  isSeller,
  isSold,
}: {
  listingId: string
  isLoggedIn: boolean
  isSeller: boolean
  isSold: boolean
}) {
  const [open, setOpen] = useState(false)

  if (isSold) {
    return (
      <div className="w-full border border-border px-6 py-4 text-sm font-medium tracking-wide text-center text-muted-foreground">
        Sold
      </div>
    )
  }

  if (isSeller) return null

  function handleClick() {
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    setOpen(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full bg-foreground text-background px-6 py-4 text-sm font-medium tracking-[0.15em] uppercase hover:opacity-90 transition-opacity"
      >
        Buy Now — Secured by VELIOR
      </button>

      {open && (
        <CheckoutModal listingId={listingId} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
