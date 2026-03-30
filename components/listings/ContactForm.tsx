'use client'

import { useState } from 'react'
import { sendMessage } from '@/lib/actions'

interface ContactFormProps {
  listingId: string
  recipientId: string
  defaultName?: string
  defaultEmail?: string
}

export default function ContactForm({ listingId, recipientId, defaultName, defaultEmail }: ContactFormProps) {
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    const res = await sendMessage(formData)
    setResult(res ?? null)
    setPending(false)
  }

  if (result?.success) {
    return (
      <div className="border border-border p-8">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">Message Sent</p>
        <p className="font-display text-xl">{result.success}</p>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="recipient_id" value={recipientId} />

      <div>
        <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
          Your Name
        </label>
        <input
          type="text"
          name="sender_name"
          required
          defaultValue={defaultName ?? ''}
          className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
          placeholder="Full name"
        />
      </div>

      <div>
        <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
          Your Email
        </label>
        <input
          type="email"
          name="sender_email"
          required
          defaultValue={defaultEmail ?? ''}
          className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
          Message
        </label>
        <textarea
          name="content"
          required
          rows={5}
          className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
          placeholder="I'm interested in this watch. Could you provide more details?"
        />
      </div>

      {result?.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-foreground text-background py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Contact Seller'}
      </button>
    </form>
  )
}
