import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
})

// Commission rate applied to every transaction
export const COMMISSION_RATE = 0.08

/**
 * Converts a EUR decimal price to cents (Stripe expects integers).
 * e.g. 8000.00 → 800000
 */
export function toCents(euros: number): number {
  return Math.round(euros * 100)
}

/**
 * Converts cents back to EUR decimal.
 */
export function fromCents(cents: number): number {
  return cents / 100
}

/**
 * Computes all amounts for a transaction.
 * Returns values in cents.
 */
export function computeAmounts(priceEuros: number): {
  amountGross: number
  commission: number
  amountNet: number
} {
  const amountGross = toCents(priceEuros)
  const commission = Math.round(amountGross * COMMISSION_RATE)
  const amountNet = amountGross - commission
  return { amountGross, commission, amountNet }
}
