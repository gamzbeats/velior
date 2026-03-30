export type Condition = 'mint' | 'excellent' | 'good' | 'fair'
export type ListingStatus = 'active' | 'sold' | 'draft'
export type SubscriptionTier = 'free' | 'pro' | 'elite'

export const TIER_CONFIG = {
  free: {
    name: 'Collector',
    price: 0,
    maxListings: 2,
    maxFavorites: 5,
    monthlyContacts: 3,
  },
  pro: {
    name: 'Seller',
    price: 19,
    maxListings: Infinity,
    maxFavorites: Infinity,
    monthlyContacts: Infinity,
  },
  elite: {
    name: 'Connoisseur',
    price: 59,
    maxListings: Infinity,
    maxFavorites: Infinity,
    monthlyContacts: Infinity,
  },
} as const

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  location: string | null
  bio: string | null
  verified: boolean
  subscription_tier: SubscriptionTier
  created_at: string
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  brand: string
  model: string
  price: number
  condition: Condition
  description: string | null
  images: string[]
  year: number | null
  reference_number: string | null
  movement: string | null
  case_size: string | null
  status: ListingStatus
  views: number
  created_at: string
  updated_at: string
  seller?: Profile
}

export interface Message {
  id: string
  listing_id: string
  sender_id: string | null
  recipient_id: string
  content: string
  read: boolean
  created_at: string
  sender_name: string | null
  sender_email: string | null
}

export interface Favorite {
  id: string
  user_id: string
  listing_id: string
  created_at: string
  listing?: Listing
}

// Payment system
export type TransactionStatus =
  | 'pending'
  | 'paid'
  | 'awaiting_shipment'
  | 'shipped'
  | 'delivered'
  | 'releasing'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled'

export type DisputeReason =
  | 'item_not_received'
  | 'item_not_as_described'
  | 'counterfeit'
  | 'damaged'
  | 'other'

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'resolved_buyer'
  | 'resolved_seller'
  | 'resolved_partial'

export type Carrier = 'dhl' | 'fedex' | 'ups' | 'colissimo' | 'other'

export interface Transaction {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  // amounts in EUR cents
  amount_gross: number
  commission: number
  amount_net: number
  stripe_payment_intent_id: string | null
  stripe_transfer_id: string | null
  stripe_refund_id: string | null
  status: TransactionStatus
  tracking_number: string | null
  carrier: Carrier | null
  shipped_at: string | null
  delivered_at: string | null
  release_after: string | null
  released_at: string | null
  created_at: string
  updated_at: string
  listing?: Listing
  buyer?: Profile
  seller?: Profile
}

export interface StripeAccount {
  id: string
  user_id: string
  stripe_connect_id: string
  kyc_status: 'pending' | 'verified' | 'rejected'
  payouts_enabled: boolean
  charges_enabled: boolean
  onboarding_url: string | null
  created_at: string
  updated_at: string
}

export interface DisputeCase {
  id: string
  transaction_id: string
  opened_by: string
  reason: DisputeReason
  description: string | null
  evidence_urls: string[]
  status: DisputeStatus
  resolution_note: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

// Commission rate (8%)
export const COMMISSION_RATE = 0.08

export type NotificationType = 'message' | 'offer' | 'favorite'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  listing_id: string | null
  read: boolean
  created_at: string
}
