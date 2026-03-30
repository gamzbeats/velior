'use client'

import { useState } from 'react'
import { sendOffer } from '@/lib/actions'

interface OfferFormProps {
  listingId: string
  recipientId: string
  defaultName?: string
  defaultEmail?: string
}

export default function OfferForm({ listingId, recipientId, defaultName, defaultEmail }: OfferFormProps) {
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const res = await sendOffer(new FormData(e.currentTarget))
    if (res?.error) { setError(res.error); setPending(false) }
    else if (res?.success) { setSuccess(res.success); setPending(false) }
  }

  if (success) {
    return (
      <div className="border border-border p-6 text-center">
        <p className="font-display text-xl mb-2">Offer Sent</p>
        <p className="text-sm text-muted-foreground">{success}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="recipient_id" value={recipientId} />

      <div>
        <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
          Your Offer (€) *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
          <input
            type="number"
            name="offer_amount"
            required
            min="1"
            placeholder="0"
            className="w-full border border-border bg-transparent pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
          Your Name
        </label>
        <input
          type="text"
          name="sender_name"
          defaultValue={defaultName ?? ''}
          placeholder="Full name"
          className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      <div>
        <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
          Your Email *
        </label>
        <input
          type="email"
          name="sender_email"
          required
          defaultValue={defaultEmail ?? ''}
          placeholder="you@example.com"
          className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      <div>
        <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
          Note (optional)
        </label>
        <textarea
          name="content"
          rows={3}
          placeholder="Add a note to your offer…"
          className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full border border-foreground py-3 text-xs font-medium tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Submit Offer'}
      </button>
    </form>
  )
}
