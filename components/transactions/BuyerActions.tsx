'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmReceipt, openDispute } from '@/lib/actions'

const DISPUTE_REASONS = [
  { value: 'item_not_received', label: 'Item not received' },
  { value: 'item_not_as_described', label: 'Not as described' },
  { value: 'counterfeit', label: 'Counterfeit / authenticity issue' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'other', label: 'Other' },
]

export default function BuyerActions({ transactionId }: { transactionId: string }) {
  const router = useRouter()
  const [view, setView] = useState<'idle' | 'dispute'>('idle')
  const [reason, setReason] = useState('item_not_received')
  const [description, setDescription] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!confirm('Confirm receipt? This will release the funds to the seller.')) return
    setPending(true)
    const res = await confirmReceipt(transactionId)
    if (res?.error) { setError(res.error); setPending(false) }
    else router.refresh()
  }

  async function handleDispute(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const res = await openDispute(transactionId, reason, description)
    if (res?.error) { setError(res.error); setPending(false) }
    else router.refresh()
  }

  if (view === 'dispute') {
    return (
      <form onSubmit={handleDispute} className="mt-4 border border-red-200 p-4 space-y-3">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-red-600">Open a dispute</p>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground">
            {DISPUTE_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={3} required placeholder="Describe the issue…"
            className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground resize-none" />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={() => setView('idle')} className="flex-1 border border-border py-2 text-xs font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="flex-1 bg-red-600 text-white py-2 text-xs font-medium hover:opacity-90 disabled:opacity-50">
            {pending ? 'Submitting…' : 'Submit dispute'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <button onClick={handleConfirm} disabled={pending}
        className="bg-foreground text-background px-5 py-2.5 text-xs font-medium tracking-[0.15em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50">
        {pending ? 'Processing…' : 'Confirm receipt'}
      </button>
      <button onClick={() => setView('dispute')}
        className="border border-red-300 text-red-600 px-5 py-2.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-red-50 transition-colors">
        Open dispute
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  )
}
