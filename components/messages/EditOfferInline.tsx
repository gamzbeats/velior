'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOffer, deleteOffer } from '@/lib/actions'

interface Props {
  messageId: string
  currentContent: string
}

function parseOffer(content: string): { amount: string; note: string } {
  const firstLine = content.split('\n')[0]
  const amount = firstLine.replace('OFFER: €', '').trim()
  const note = content.includes('\n\n') ? content.split('\n\n').slice(1).join('\n\n') : ''
  return { amount, note }
}

export default function EditOfferInline({ messageId, currentContent }: Props) {
  const router = useRouter()
  const { amount: initialAmount, note: initialNote } = parseOffer(currentContent)
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(initialAmount)
  const [note, setNote] = useState(initialNote)
  const [pending, setPending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!amount) return
    setPending(true)
    setError(null)
    const res = await updateOffer(messageId, amount, note)
    if (res?.error) {
      setError(res.error)
      setPending(false)
    } else {
      setEditing(false)
      setPending(false)
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this offer?')) return
    setDeleting(true)
    const res = await deleteOffer(messageId)
    if (res?.error) {
      setError(res.error)
      setDeleting(false)
    } else {
      router.refresh()
    }
  }

  if (!editing) {
    return (
      <div className="mt-1.5 flex items-center gap-3">
        <button
          onClick={() => setEditing(true)}
          className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Edit offer
        </button>
        <span className="text-muted-foreground/30 text-[10px]">·</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2 border border-border bg-background p-4 space-y-3 w-72">
      <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
        Edit your offer
      </p>

      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Amount (€)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            className="w-full border border-border bg-transparent pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Add a note…"
          className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => setEditing(false)}
          className="flex-1 border border-border py-2 text-xs font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={pending || !amount}
          className="flex-1 bg-foreground text-background py-2 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
