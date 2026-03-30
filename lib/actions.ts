'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  })

  if (error) return { error: error.message }

  return { success: 'Check your email for a magic link.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

// ─── Listings ────────────────────────────────────────────────────────────────

export async function createListing(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to create a listing.' }

  // Ensure profile exists
  await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

  // Enforce free tier listing limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()
  const tier = profile?.subscription_tier ?? 'free'

  if (tier === 'free') {
    const { count } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .neq('status', 'draft')
    if ((count ?? 0) >= 2) {
      return { error: 'Free accounts are limited to 2 listings. Upgrade to Pro to list unlimited watches.' }
    }
  }

  const images: string[] = []
  const imageFiles = formData.getAll('images') as File[]

  for (const file of imageFiles) {
    if (!file || file.size === 0) continue
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, file)
    if (!uploadError) {
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
      images.push(data.publicUrl)
    }
  }

  const { error } = await supabase.from('listings').insert({
    seller_id: user.id,
    title: formData.get('title') as string,
    brand: formData.get('brand') as string,
    model: formData.get('model') as string,
    price: parseFloat(formData.get('price') as string),
    condition: formData.get('condition') as string,
    description: formData.get('description') as string,
    year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
    reference_number: (formData.get('reference_number') as string) || null,
    movement: (formData.get('movement') as string) || null,
    case_size: (formData.get('case_size') as string) || null,
    images,
    status: 'active',
  })

  if (error) return { error: error.message }

  revalidatePath('/listings')
  redirect('/listings')
}

export async function updateListing(listingId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const newImages: string[] = []
  const imageFiles = formData.getAll('images') as File[]
  for (const file of imageFiles) {
    if (!file || file.size === 0) continue
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, file)
    if (!uploadError) {
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
      newImages.push(data.publicUrl)
    }
  }

  const existingImages: string[] = JSON.parse((formData.get('existing_images') as string) ?? '[]')
  const images = [...existingImages, ...newImages]

  const { error } = await supabase
    .from('listings')
    .update({
      title: formData.get('title') as string,
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      price: parseFloat(formData.get('price') as string),
      condition: formData.get('condition') as string,
      description: formData.get('description') as string,
      year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
      reference_number: (formData.get('reference_number') as string) || null,
      movement: (formData.get('movement') as string) || null,
      case_size: (formData.get('case_size') as string) || null,
      images,
    })
    .eq('id', listingId)
    .eq('seller_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/profile')
  redirect(`/listings/${listingId}`)
}

export async function markAsSold(listingId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('listings')
    .update({ status: 'sold' })
    .eq('id', listingId)
    .eq('seller_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('seller_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/listings')
  return { success: true }
}

export async function incrementViews(listingId: string) {
  const supabase = await createClient()
  await supabase.rpc('increment_listing_views', { listing_id: listingId })
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export async function toggleFavorite(listingId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'login_required' }

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .single()

  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id)
    revalidatePath('/watchlist')
    return { favorited: false }
  }

  // Enforce free tier favorites limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()
  const tier = profile?.subscription_tier ?? 'free'

  if (tier === 'free') {
    const { count } = await supabase
      .from('favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= 5) {
      return { error: 'Free accounts can save up to 5 watches. Upgrade to Pro for unlimited favorites.' }
    }
  }

  await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId })

  // Notify seller (skip if user is the seller)
  const { data: listing } = await supabase
    .from('listings')
    .select('seller_id, title')
    .eq('id', listingId)
    .single()
  if (listing && listing.seller_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: listing.seller_id,
      type: 'favorite',
      title: `Someone saved your listing`,
      body: listing.title,
      listing_id: listingId,
    })
  }

  revalidatePath('/watchlist')
  return { favorited: true }
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function sendMessage(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Enforce free tier contact limit
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    const tier = profile?.subscription_tier ?? 'free'

    if (tier === 'free') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
      if ((count ?? 0) >= 3) {
        return { error: 'Free accounts can contact 3 sellers per month. Upgrade to Pro for unlimited contacts.' }
      }
    }
  }

  const listingId = formData.get('listing_id') as string
  const recipientId = formData.get('recipient_id') as string
  const content = formData.get('content') as string

  const { error } = await supabase.from('messages').insert({
    listing_id: listingId,
    recipient_id: recipientId,
    content,
    sender_name: (formData.get('sender_name') as string) || null,
    sender_email: (formData.get('sender_email') as string) || null,
    sender_id: user?.id ?? null,
  })

  if (error) return { error: error.message }

  // Notify recipient
  const { data: listing } = await supabase
    .from('listings')
    .select('title')
    .eq('id', listingId)
    .single()
  const senderLabel = user
    ? ((formData.get('sender_name') as string) || user.email || 'Someone')
    : ((formData.get('sender_name') as string) || 'Someone')
  await supabase.from('notifications').insert({
    user_id: recipientId,
    type: 'message',
    title: `New message about ${listing?.title ?? 'your listing'}`,
    body: content.slice(0, 80),
    listing_id: listingId,
  })

  return { success: 'Your message has been sent to the seller.' }
}

export async function sendOffer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const offerAmount = formData.get('offer_amount') as string
  const note = (formData.get('content') as string) || ''
  const content = `OFFER: €${offerAmount}${note ? `\n\n${note}` : ''}`

  const listingId2 = formData.get('listing_id') as string
  const recipientId2 = formData.get('recipient_id') as string

  const { error } = await supabase.from('messages').insert({
    listing_id: listingId2,
    recipient_id: recipientId2,
    content,
    sender_name: (formData.get('sender_name') as string) || null,
    sender_email: (formData.get('sender_email') as string) || null,
    sender_id: user?.id ?? null,
  })

  if (error) return { error: error.message }

  // Notify recipient
  const { data: listing2 } = await supabase
    .from('listings')
    .select('title')
    .eq('id', listingId2)
    .single()
  await supabase.from('notifications').insert({
    user_id: recipientId2,
    type: 'offer',
    title: `New offer on ${listing2?.title ?? 'your listing'}`,
    body: `€${offerAmount}`,
    listing_id: listingId2,
  })

  return { success: 'Your offer has been sent to the seller.' }
}

export async function markMessagesRead(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ read: true })
    .eq('recipient_id', user.id)
    .eq('listing_id', listingId)
    .eq('read', false)
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
}
