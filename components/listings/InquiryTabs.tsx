'use client'

import { useState } from 'react'
import ContactForm from './ContactForm'
import OfferForm from './OfferForm'

interface InquiryTabsProps {
  listingId: string
  recipientId: string
  defaultName?: string
  defaultEmail?: string
}

export default function InquiryTabs({ listingId, recipientId, defaultName, defaultEmail }: InquiryTabsProps) {
  const [tab, setTab] = useState<'inquire' | 'offer'>('inquire')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border border-border p-1 mb-6">
        <button
          type="button"
          onClick={() => setTab('inquire')}
          className={`flex-1 py-2 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${
            tab === 'inquire' ? 'bg-foreground text-background' : 'text-muted-foreground'
          }`}
        >
          Inquire
        </button>
        <button
          type="button"
          onClick={() => setTab('offer')}
          className={`flex-1 py-2 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${
            tab === 'offer' ? 'bg-foreground text-background' : 'text-muted-foreground'
          }`}
        >
          Make an Offer
        </button>
      </div>

      {tab === 'inquire' ? (
        <ContactForm listingId={listingId} recipientId={recipientId} defaultName={defaultName} defaultEmail={defaultEmail} />
      ) : (
        <OfferForm listingId={listingId} recipientId={recipientId} defaultName={defaultName} defaultEmail={defaultEmail} />
      )}
    </div>
  )
}
