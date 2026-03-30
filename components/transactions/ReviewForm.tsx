'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/lib/actions'

export default function ReviewForm({ transactionId }: { transactionId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) return
    setPending(true)
    setError(null)
    const res = await submitReview(transactionId, rating, comment)
    if (res?.error) {
      setError(res.error)
      setPending(false)
    } else {
      setDone(true)
      router.refresh()
    }
  }

  if (done) {
    return <p className="text-xs text-green-700 mt-2">Review submitted. Thank you.</p>
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-2 text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 pb-0.5">
        Leave a review
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border border-border p-4 space-y-4">
      <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Rate this seller</p>

      {/* Star picker */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="text-2xl leading-none transition-colors"
          >
            <span className={(hovered || rating) >= star ? 'text-[#B8973A]' : 'text-muted-foreground/30'}>
              ★
            </span>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Share your experience (optional)…"
        className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-border py-2 text-xs font-medium hover:bg-muted transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={pending || rating === 0} className="flex-1 bg-foreground text-background py-2 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </form>
  )
}
