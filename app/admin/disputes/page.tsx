'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { resolveDispute } from '@/lib/actions'

function DisputeResolveInner() {
  const params = useSearchParams()
  const router = useRouter()
  const id = params.get('id')
  const resolution = params.get('resolution') as 'refund_buyer' | 'release_seller' | null
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!id || !resolution) {
    return (
      <div className="pt-32 text-center">
        <p className="text-muted-foreground">Invalid dispute link.</p>
      </div>
    )
  }

  const label = resolution === 'refund_buyer' ? 'Refund buyer' : 'Release payout to seller'
  const description = resolution === 'refund_buyer'
    ? 'This will issue a full Stripe refund to the buyer and mark the transaction as refunded.'
    : 'This will transfer the net amount to the seller\'s Stripe account and mark the transaction as completed.'

  async function handleConfirm() {
    if (!id || !resolution) return
    setPending(true)
    setError(null)
    const res = await resolveDispute(id, resolution)
    if (res?.error) {
      setError(res.error)
      setPending(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="pt-32 min-h-screen">
      <div className="max-w-md mx-auto px-6">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground mb-4">Admin · Disputes</p>
        <h1 className="font-display text-3xl font-light mb-6">{label}</h1>
        <p className="text-sm text-muted-foreground mb-8">{description}</p>

        {error && <p className="text-xs text-red-600 mb-4 border border-red-200 px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="flex-1 border border-border py-3 text-xs font-medium tracking-[0.15em] uppercase hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={pending}
            className={`flex-1 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-opacity disabled:opacity-50 ${
              resolution === 'refund_buyer'
                ? 'bg-red-600 text-white hover:opacity-90'
                : 'bg-foreground text-background hover:opacity-90'
            }`}
          >
            {pending ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DisputePage() {
  return (
    <Suspense>
      <DisputeResolveInner />
    </Suspense>
  )
}
