import "server-only";

import Stripe from "stripe";

// Pin the API version so minor library upgrades don't silently change behavior.
// Bump deliberately when upgrading the SDK.
const STRIPE_API_VERSION = "2026-03-25.dahlia" as const;

/**
 * Shared Stripe SDK instance. Whenever STRIPE_SECRET_KEY is absent (dev, the
 * `next build` page-data collection step on a CI runner without secrets) we
 * expose a `Proxy` that throws on property access. This keeps module eval
 * crash-free while still failing loudly if billing code paths are actually
 * exercised without a real key.
 */
function stubStripe(): Stripe {
  return new Proxy({} as Stripe, {
    get() {
      throw new Error(
        "Stripe SDK not configured — set STRIPE_SECRET_KEY to enable billing.",
      );
    },
  });
}

export const stripe: Stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
    })
  : stubStripe();

export const STRIPE_PLAN_NAME = "premium" as const;
