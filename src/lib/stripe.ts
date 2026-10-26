import Stripe from "stripe";

// Lazily initialize Stripe client
let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia" as any,
      typescript: true,
    });
  }

  return stripeInstance;
}

export const PLANS = {
  monthly: {
    name: "ImgDrop PRO Mensal",
    priceBRL: 1990, // R$ 19,90 em centavos
    priceUSD: 499, // $4.99 em centavos
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  },
  yearly: {
    name: "ImgDrop PRO Anual",
    priceBRL: 19900, // R$ 199,00 em centavos (2 meses grátis)
    priceUSD: 4990, // $49.90 em centavos
    priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
};
