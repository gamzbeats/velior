export type Condition = 'mint' | 'excellent' | 'good' | 'fair'
export type ListingStatus = 'active' | 'sold' | 'draft'

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  location: string | null
  bio: string | null
  verified: boolean
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
