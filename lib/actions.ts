'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

// Service client bypasses RLS — used for transaction mutations
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

  revalidatePath('/messages')
  return { success: 'Your message has been sent to the seller.' }
}

export async function deleteOffer(messageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: msg } = await supabase
    .from('messages')
    .select('id, sender_id, content')
    .eq('id', messageId)
    .single()

  if (!msg) return { error: 'Message not found' }
  if (msg.sender_id !== user.id) return { error: 'Unauthorized' }
  if (!msg.content.startsWith('OFFER: €')) return { error: 'This message is not an offer' }

  const { error } = await supabase.from('messages').delete().eq('id', messageId)
  if (error) return { error: error.message }

  revalidatePath('/messages')
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)
}

export async function updateOffer(messageId: string, newAmount: string, newNote: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify the message belongs to this user and is an offer
  const { data: msg } = await supabase
    .from('messages')
    .select('id, sender_id, content')
    .eq('id', messageId)
    .single()

  if (!msg) return { error: 'Message not found' }
  if (msg.sender_id !== user.id) return { error: 'Unauthorized' }
  if (!msg.content.startsWith('OFFER: €')) return { error: 'This message is not an offer' }

  const newContent = `OFFER: €${newAmount}${newNote ? `\n\n${newNote}` : ''}`

  const { error } = await supabase
    .from('messages')
    .update({ content: newContent })
    .eq('id', messageId)

  if (error) return { error: error.message }

  revalidatePath('/messages')
  return { success: true }
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

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  let avatar_url: string | undefined

  const avatarFile = formData.get('avatar') as File | null
  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, avatarFile, { upsert: true })
    if (!uploadError) {
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
      avatar_url = data.publicUrl
    }
  }

  const updates: Record<string, string | undefined> = {
    full_name: (formData.get('full_name') as string) || undefined,
    username: (formData.get('username') as string) || undefined,
    bio: (formData.get('bio') as string) || undefined,
    location: (formData.get('location') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    avatar_url,
  }

  // Remove undefined keys
  Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k])

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath('/profile')
  return { success: true }
}

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

// ─── Transactions ────────────────────────────────────────────────────────────

/**
 * Called by the seller to confirm they have shipped the watch.
 */
export async function shipWatch(transactionId: string, trackingNumber: string, carrier: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, seller_id, status')
    .eq('id', transactionId)
    .single()

  if (!tx) return { error: 'Transaction not found' }
  if (tx.seller_id !== user.id) return { error: 'Unauthorized' }
  if (tx.status !== 'awaiting_shipment') return { error: 'Transaction is not awaiting shipment' }

  const { error } = await getServiceClient()
    .from('transactions')
    .update({
      status: 'shipped',
      tracking_number: trackingNumber,
      carrier,
      shipped_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  if (error) return { error: error.message }

  revalidatePath('/transactions')
  revalidatePath('/profile')
  return { success: true }
}

/**
 * Called by the buyer to confirm receipt and trigger payout.
 */
export async function confirmReceipt(transactionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, buyer_id, seller_id, amount_net, status, stripe_payment_intent_id')
    .eq('id', transactionId)
    .single()

  if (!tx) return { error: 'Transaction not found' }
  if (tx.buyer_id !== user.id) return { error: 'Unauthorized' }
  if (!['shipped', 'delivered'].includes(tx.status)) return { error: 'Cannot confirm receipt at this stage' }

  const result = await releasePayout(tx)
  return result
}

/**
 * Internal helper: transfer funds to seller via Stripe.
 * Can be called by buyer confirmation OR automated timer.
 */
export async function releasePayout(tx: {
  id: string
  seller_id: string
  amount_net: number
  stripe_payment_intent_id: string | null
}) {
  const supabase = await createClient()

  const service = getServiceClient()

  // Get seller's Stripe Connect ID
  const { data: sellerAccount } = await service
    .from('stripe_accounts')
    .select('stripe_connect_id')
    .eq('user_id', tx.seller_id)
    .single()

  if (!sellerAccount) return { error: 'Seller Stripe account not found' }

  // Transfer funds from VELIOR's Stripe balance to seller's Connect account
  const transfer = await stripe.transfers.create({
    amount: tx.amount_net,
    currency: 'eur',
    destination: sellerAccount.stripe_connect_id,
    metadata: { transaction_id: tx.id },
  })

  await service
    .from('transactions')
    .update({
      status: 'completed',
      stripe_transfer_id: transfer.id,
      released_at: new Date().toISOString(),
    })
    .eq('id', tx.id)

  revalidatePath('/profile')
  return { success: true }
}

/**
 * Opens a dispute. Freezes the payout until VELIOR resolves it.
 */
export async function openDispute(
  transactionId: string,
  reason: string,
  description: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, buyer_id, seller_id, status')
    .eq('id', transactionId)
    .single()

  if (!tx) return { error: 'Transaction not found' }
  if (tx.buyer_id !== user.id && tx.seller_id !== user.id) return { error: 'Unauthorized' }
  if (['completed', 'refunded', 'cancelled', 'disputed'].includes(tx.status)) {
    return { error: 'Cannot open a dispute for this transaction' }
  }

  const service = getServiceClient()

  // Freeze payout
  await service
    .from('transactions')
    .update({ status: 'disputed' })
    .eq('id', transactionId)

  // Create dispute record
  const { error } = await service.from('dispute_cases').insert({
    transaction_id: transactionId,
    opened_by: user.id,
    reason,
    description,
  })

  if (error) return { error: error.message }

  revalidatePath('/transactions')
  revalidatePath('/profile')
  return { success: true }
}

/**
 * Fetches all transactions for the current user (as buyer or seller).
 */
export async function submitReview(transactionId: string, rating: number, comment: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, buyer_id, seller_id, status')
    .eq('id', transactionId)
    .single()

  if (!tx) return { error: 'Transaction not found' }
  if (tx.buyer_id !== user.id) return { error: 'Only the buyer can leave a review' }
  if (tx.status !== 'completed') return { error: 'Review only available after transaction is completed' }

  const { error } = await supabase.from('reviews').insert({
    transaction_id: transactionId,
    reviewer_id: user.id,
    seller_id: tx.seller_id,
    rating,
    comment: comment || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/transactions')
  return { success: true }
}

// ─── Admin ───────────────────────────────────────────────────────────────────

/**
 * Admin-only: resolve a dispute by either refunding the buyer or releasing payout to the seller.
 */
export async function resolveDispute(
  disputeId: string,
  resolution: 'refund_buyer' | 'release_seller'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify admin
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Forbidden' }

  const service = getServiceClient()

  const { data: dispute } = await service
    .from('dispute_cases')
    .select('id, transaction_id, status')
    .eq('id', disputeId)
    .single()

  if (!dispute) return { error: 'Dispute not found' }
  if (dispute.status !== 'open') return { error: 'Dispute is already resolved' }

  const { data: tx } = await service
    .from('transactions')
    .select('id, seller_id, amount_net, stripe_payment_intent_id')
    .eq('id', dispute.transaction_id)
    .single()

  if (!tx) return { error: 'Transaction not found' }

  if (resolution === 'refund_buyer') {
    // Issue Stripe refund
    if (tx.stripe_payment_intent_id) {
      await stripe.refunds.create({ payment_intent: tx.stripe_payment_intent_id })
    }
    await service.from('transactions').update({ status: 'refunded' }).eq('id', tx.id)
  } else {
    // Release payout to seller
    const { data: sellerAccount } = await service
      .from('stripe_accounts')
      .select('stripe_connect_id')
      .eq('user_id', tx.seller_id)
      .single()

    if (sellerAccount) {
      const transfer = await stripe.transfers.create({
        amount: tx.amount_net,
        currency: 'eur',
        destination: sellerAccount.stripe_connect_id,
        metadata: { transaction_id: tx.id, dispute_id: disputeId },
      })
      await service
        .from('transactions')
        .update({ status: 'completed', stripe_transfer_id: transfer.id, released_at: new Date().toISOString() })
        .eq('id', tx.id)
    }
  }

  await service
    .from('dispute_cases')
    .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolution_note: resolution })
    .eq('id', disputeId)

  revalidatePath('/admin')
  revalidatePath('/admin/disputes')
  revalidatePath('/transactions')
  return { success: true }
}

export async function getMyTransactions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('transactions')
    .select(`
      *,
      listing:listings(id, title, brand, model, images, price),
      buyer:profiles!transactions_buyer_id_fkey(id, full_name, username),
      seller:profiles!transactions_seller_id_fkey(id, full_name, username)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return data ?? []
}
