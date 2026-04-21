import "server-only";

import { cache } from "react";

import { stripe } from "./stripe";

export type PriceInfo = {
  /** Unit amount in major currency units (e.g. 29 for €29). */
  amount: number;
  /** ISO currency code, lowercase (eur/usd/...). */
  currency: string;
  /** Recurring interval, e.g. "month" / "year". */
  interval: "day" | "week" | "month" | "year" | null;
  /** Pre-formatted display string, e.g. "29 € / month". */
  display: string;
};

export type PlanPrices = {
  monthly: PriceInfo | null;
  yearly: PriceInfo | null;
  /** Percent saved on yearly vs 12× monthly, rounded down. Null if either price is missing. */
  yearlySavingsPercent: number | null;
};

const INTERVAL_LABEL: Record<string, string> = {
  month: "month",
  year: "year",
  week: "week",
  day: "day",
};

function formatAmount(unitAmount: number, currency: string, interval?: string | null) {
  // Stripe returns minor units (cents). 0-decimal currencies (JPY, KRW) are not
  // supported here yet — would need a lookup; defaulting to /100 covers EUR/USD/GBP.
  const amount = unitAmount / 100;
  const symbol =
    currency.toUpperCase() === "EUR"
      ? "€"
      : currency.toUpperCase() === "USD"
        ? "$"
        : currency.toUpperCase() === "GBP"
          ? "£"
          : currency.toUpperCase();
  const intervalLabel = interval ? ` / ${INTERVAL_LABEL[interval] ?? interval}` : "";
  // Strip trailing .00 to keep the price tidy (€29 reads better than €29.00).
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${formatted} ${symbol}${intervalLabel}`;
}

async function fetchPrice(priceId: string | undefined): Promise<PriceInfo | null> {
  if (!priceId) return null;
  if (!process.env.STRIPE_SECRET_KEY) return null;
  try {
    const price = await stripe.prices.retrieve(priceId);
    if (!price.unit_amount) return null;
    const interval = price.recurring?.interval ?? null;
    return {
      amount: price.unit_amount / 100,
      currency: price.currency,
      interval,
      display: formatAmount(price.unit_amount, price.currency, interval),
    };
  } catch {
    // Bad price id, network blip, plugin not configured — just degrade
    // gracefully to "no price shown" rather than crash the whole settings page.
    return null;
  }
}

/**
 * Fetches both Premium prices from Stripe. `cache()` dedupes within a single
 * RSC request — multiple components on the same page share one round-trip.
 */
export const getPlanPrices = cache(async (): Promise<PlanPrices> => {
  const [monthly, yearly] = await Promise.all([
    fetchPrice(process.env.STRIPE_PRICE_PREMIUM_MONTHLY),
    fetchPrice(process.env.STRIPE_PRICE_PREMIUM_YEARLY),
  ]);

  let yearlySavingsPercent: number | null = null;
  if (monthly && yearly) {
    const yearlyEquivalent = monthly.amount * 12;
    if (yearlyEquivalent > yearly.amount && yearlyEquivalent > 0) {
      yearlySavingsPercent = Math.floor(
        ((yearlyEquivalent - yearly.amount) / yearlyEquivalent) * 100,
      );
    }
  }

  return { monthly, yearly, yearlySavingsPercent };
});
