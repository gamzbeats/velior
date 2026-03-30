'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { shipWatch } from '@/lib/actions'

const CARRIERS = [
  { value: 'dhl', label: 'DHL Express' },
  { value: 'fedex', label: 'FedEx Priority' },
  { value: 'ups', label: 'UPS Secure' },
  { value: 'colissimo', label: 'Colissimo' },
  { value: 'other', label: 'Other' },
]

export default function ShipForm({ transactionId }: { transactionId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [carrier, setCarrier] = useState('dhl')
  const [tracking, setTracking] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tracking.trim()) return
    setPending(true)
    setError(null)
    const res = await shipWatch(transactionId, tracking.trim(), carrier)
    if (res?.error) {
      setError(res.error)
      setPending(false)
    } else {
      router.refresh()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-foreground text-background px-5 py-2.5 text-xs font-medium tracking-[0.15em] uppercase hover:opacity-90 transition-opacity"
      >
        Mark as shipped
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border border-border p-4 space-y-3">
      <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Shipment details</p>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Carrier</label>
        <select
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
        >
          {CARRIERS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Tracking number</label>
        <input
          type="text"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          required
          placeholder="e.g. 1Z999AA10123456784"
          className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-border py-2 text-xs font-medium hover:bg-muted transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={pending || !tracking.trim()} className="flex-1 bg-foreground text-background py-2 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Saving…' : 'Confirm shipment'}
        </button>
      </div>
    </form>
  )
}
