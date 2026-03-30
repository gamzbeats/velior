'use client'

import { useState } from 'react'

export default function SellerOnboarding({
  payoutsEnabled,
}: {
  payoutsEnabled: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function handleOnboard() {
    setLoading(true)
    const res = await fetch('/api/connect/onboard', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert(data.error ?? 'Une erreur est survenue.')
      setLoading(false)
    }
  }

  if (payoutsEnabled) {
    return (
      <div className="border border-border bg-card px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">Seller Account</p>
          <p className="text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-600 inline-block" />
            Verified — payouts enabled
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border bg-card px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">Seller Account</p>
        <p className="text-sm text-muted-foreground">
          Complete your payment setup to receive payouts when you sell a watch.
        </p>
      </div>
      <button
        onClick={handleOnboard}
        disabled={loading}
        className="shrink-0 bg-foreground text-background px-5 py-2.5 text-xs font-medium tracking-[0.2em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Redirecting…' : 'Set up payouts'}
      </button>
    </div>
  )
}
