import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe, computeAmounts } from '@/lib/stripe'

// Service client bypasses RLS — used only to read seller's stripe account
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { listingId } = await req.json()
  if (!listingId) {
    return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
  }

  // Fetch listing — price is authoritative from DB, never from client
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, price, status, seller_id, title, brand, model')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  if (listing.status !== 'active') {
    return NextResponse.json({ error: 'This listing is no longer available' }, { status: 409 })
  }
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: 'You cannot buy your own listing' }, { status: 400 })
  }

  // Check seller has a verified Stripe Connect account (service client bypasses RLS)
  const { data: sellerStripeAccount } = await serviceClient
    .from('stripe_accounts')
    .select('stripe_connect_id, payouts_enabled')
    .eq('user_id', listing.seller_id)
    .single()

  if (!sellerStripeAccount?.payouts_enabled) {
    return NextResponse.json(
      { error: 'The seller has not completed their payment setup yet.' },
      { status: 409 }
    )
  }

  // Check no active transaction exists for this listing
  const { data: existingTx } = await supabase
    .from('transactions')
    .select('id, status')
    .eq('listing_id', listingId)
    .not('status', 'in', '("cancelled","refunded")')
    .maybeSingle()

  if (existingTx) {
    return NextResponse.json({ error: 'A transaction is already in progress for this listing' }, { status: 409 })
  }

  const { amountGross, commission, amountNet } = computeAmounts(listing.price)

  // Create Stripe PaymentIntent — funds go to VELIOR's account, NOT directly to seller
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountGross,
    currency: 'eur',
    payment_method_types: ['card'],
    payment_method_options: {
      card: {
        // Force 3DS for all payments (EU SCA compliance)
        request_three_d_secure: 'any',
      },
    },
    metadata: {
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      seller_connect_id: sellerStripeAccount.stripe_connect_id,
    },
    description: `VELIOR — ${listing.brand} ${listing.model} (${listing.title})`,
  })

  // Create transaction record in DB (service client — RLS blocks user inserts on transactions)
  const { data: transaction, error: txError } = await serviceClient
    .from('transactions')
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount_gross: amountGross,
      commission,
      amount_net: amountNet,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
    })
    .select('id')
    .single()

  if (txError) {
    // Cancel the PaymentIntent to avoid orphaned charges
    await stripe.paymentIntents.cancel(paymentIntent.id)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    transactionId: transaction.id,
    amountGross,
    commission,
    amountNet,
  })
}
