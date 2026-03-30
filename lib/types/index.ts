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
