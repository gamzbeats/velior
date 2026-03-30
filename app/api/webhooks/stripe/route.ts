import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Webhook handler uses the service-role client (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceClient()

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(supabase, event.data.object as Stripe.PaymentIntent, event.id)
      break

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(supabase, event.data.object as Stripe.PaymentIntent, event.id)
      break

    case 'account.updated':
      await handleAccountUpdated(supabase, event.data.object as Stripe.Account)
      break

    default:
      // Ignore unhandled events
      break
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentSucceeded(
  supabase: ReturnType<typeof getServiceClient>,
  intent: Stripe.PaymentIntent,
  eventId: string
) {
  // Idempotency: skip if we already processed this event
  const { data: existing } = await supabase
    .from('transactions')
    .select('id, stripe_event_ids')
    .eq('stripe_payment_intent_id', intent.id)
    .single()

  if (!existing) return
  if (existing.stripe_event_ids?.includes(eventId)) return

  // Compute auto-release timestamp: 72h after now
  // (in production, set this after delivery confirmation instead)
  const releaseAfter = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  await supabase
    .from('transactions')
    .update({
      status: 'awaiting_shipment',
      stripe_event_ids: [...(existing.stripe_event_ids ?? []), eventId],
      release_after: releaseAfter,
    })
    .eq('id', existing.id)

  // Mark listing as sold so it no longer appears in search
  await supabase
    .from('listings')
    .update({ status: 'sold' })
    .eq('id', intent.metadata.listing_id)
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof getServiceClient>,
  intent: Stripe.PaymentIntent,
  eventId: string
) {
  const { data: existing } = await supabase
    .from('transactions')
    .select('id, stripe_event_ids')
    .eq('stripe_payment_intent_id', intent.id)
    .single()

  if (!existing) return
  if (existing.stripe_event_ids?.includes(eventId)) return

  await supabase
    .from('transactions')
    .update({
      status: 'cancelled',
      stripe_event_ids: [...(existing.stripe_event_ids ?? []), eventId],
    })
    .eq('id', existing.id)
}

async function handleAccountUpdated(
  supabase: ReturnType<typeof getServiceClient>,
  account: Stripe.Account
) {
  const kycStatus =
    account.individual?.verification?.status === 'verified' ? 'verified'
    : account.individual?.verification?.status === 'unverified' ? 'rejected'
    : 'pending'

  await supabase
    .from('stripe_accounts')
    .update({
      payouts_enabled: account.payouts_enabled ?? false,
      charges_enabled: account.charges_enabled ?? false,
      kyc_status: kycStatus,
    })
    .eq('stripe_connect_id', account.id)
}
