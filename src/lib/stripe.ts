import "server-only";
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Returns a singleton Stripe client instance initialized with STRIPE_SECRET_KEY.
 * Never exposed to the browser.
 */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      typescript: true,
      appInfo: {
        name: "Masaar Holidays eSIM",
        version: "1.0.0",
      },
    });
  }

  return stripeInstance;
}
