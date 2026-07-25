import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
})

export const PLATFORM_FEE_PERCENT = 20

export function applicationFee(priceOre: number): number {
  return Math.round(priceOre * (PLATFORM_FEE_PERCENT / 100))
}
