'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { type Listing } from '@/lib/types'
import { markAsSold, deleteListing } from '@/lib/actions'

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  sold: 'Sold',
  draft: 'Draft',
}

interface ListingManagerProps {
  listings: Listing[]
}

export default function ListingManager({ listings }: ListingManagerProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (listings.length === 0) {
    return (
      <div className="py-24 text-center border border-dashed border-border">
        <p className="font-display text-2xl text-muted-foreground/40 font-light mb-4">No listings yet</p>
        <Link href="/sell" className="text-xs font-medium tracking-[0.2em] uppercase border-b border-foreground pb-0.5">
          Create your first listing
        </Link>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border border-t border-border">
      {listings.map((listing) => (
        <div key={listing.id} className="flex items-center gap-6 py-5">
          {/* Thumbnail */}
          <Link href={`/listings/${listing.id}`} className="shrink-0">
            <div className="relative w-16 h-16 bg-muted overflow-hidden">
              {listing.images?.[0] ? (
                <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="absolute inset-0 bg-muted" />
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
              {listing.brand}
            </p>
            <Link href={`/listings/${listing.id}`} className="font-display text-base font-medium hover:underline underline-offset-2 block truncate">
              {listing.model}
            </Link>
            <p className="text-sm text-muted-foreground">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price)}
            </p>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
            <div className="text-center">
              <p className="font-medium text-foreground">{listing.views ?? 0}</p>
              <p className="text-[10px] tracking-[0.15em] uppercase">Views</p>
            </div>
            <div>
              <span className={`text-[10px] font-medium tracking-[0.15em] uppercase border px-2.5 py-1 ${
                listing.status === 'active'
                  ? 'border-foreground text-foreground'
                  : 'border-border text-muted-foreground'
              }`}>
                {STATUS_LABELS[listing.status] ?? listing.status}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {listing.status === 'active' && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => { markAsSold(listing.id) })}
                className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                Sold
              </button>
            )}
            <Link
              href={`/sell/edit/${listing.id}`}
              className="text-[10px] font-medium tracking-[0.15em] uppercase hover:text-muted-foreground transition-colors"
            >
              Edit
            </Link>
            {confirmDelete === listing.id ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(async () => {
                    await deleteListing(listing.id)
                    setConfirmDelete(null)
                  })}
                  className="text-[10px] font-medium tracking-[0.15em] uppercase text-destructive hover:opacity-70 transition-opacity disabled:opacity-40"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(listing.id)}
                className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-destructive transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
