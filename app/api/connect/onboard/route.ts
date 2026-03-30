import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Check if seller already has a Connect account
  const { data: existing } = await supabase
    .from('stripe_accounts')
    .select('stripe_connect_id, payouts_enabled')
    .eq('user_id', user.id)
    .single()

  let connectId: string

  if (existing) {
    connectId = existing.stripe_connect_id
  } else {
    // Get profile for pre-filling
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single()

    // Create a Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: { user_id: user.id },
    })

    connectId = account.id

    // Persist in DB
    await supabase.from('stripe_accounts').insert({
      user_id: user.id,
      stripe_connect_id: connectId,
      kyc_status: 'pending',
      payouts_enabled: false,
      charges_enabled: false,
    })
  }

  // Generate a fresh onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: connectId,
    refresh_url: `${siteUrl}/profile?connect=refresh`,
    return_url: `${siteUrl}/profile?connect=success`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
