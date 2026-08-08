import Stripe from 'stripe'
import { PLATFORM_FEE_PERCENT } from '@/lib/platform-fee'

export { PLATFORM_FEE_PERCENT }

/** Strip quotes/newlines from pasted Vercel/.env values (avoids ERR_INVALID_CHAR on Authorization). */
function stripeSecretKey(): string {
  let key = (process.env.STRIPE_SECRET_KEY ?? '').trim()
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim()
  }
  key = key.replace(/[\r\n]/g, '')
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is missing (server-only).')
  }
  return key
}

export const stripe = new Stripe(stripeSecretKey(), {
  apiVersion: '2026-06-24.dahlia',
})

/** Platform take rate — covers Stripe fees + Festly costs (not pure profit). */
export function applicationFee(priceOre: number): number {
  return Math.round(priceOre * (PLATFORM_FEE_PERCENT / 100))
}

/** Amount transferred to the provider after release (80% of quote). */
export function providerPayout(priceOre: number): number {
  return priceOre - applicationFee(priceOre)
}
