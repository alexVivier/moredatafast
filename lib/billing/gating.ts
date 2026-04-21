import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, schema } from "@/db/client";

/**
 * Statuses that grant access to gated actions. `trialing` is covered by the
 * Stripe sub itself once the user has pressed "Subscribe"; `active` is the
 * post-trial paid state. Everything else (incomplete, past_due, canceled,
 * unpaid, paused, incomplete_expired) means no active sub → fall back to
 * the DB trial clock.
 */
const ACTIVE_STATUSES = ["active", "trialing"] as const;

export type BillingStatus = {
  /** True when the org can perform gated actions right now. */
  hasAccess: boolean;
  /** DB trial clock — what `organizations.trial_ends_at` stores. */
  trialEndsAt: Date;
  /** Whether the trial clock is still in the future (independent of sub). */
  trialActive: boolean;
  /** Current Stripe subscription status for the org, if any. */
  subscriptionStatus: string | null;
  /** Billing period end, if a sub exists. Useful for "renews on…" copy. */
  periodEnd: Date | null;
  /** True when the current sub is scheduled to stop at period end. */
  cancelAtPeriodEnd: boolean;
};

export async function getBillingStatus(
  organizationId: string,
): Promise<BillingStatus> {
  const [org] = await db
    .select({ trialEndsAt: schema.organizations.trialEndsAt })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);

  const trialEndsAt = org?.trialEndsAt ?? new Date(0);
  const trialActive = trialEndsAt.getTime() > Date.now();

  const [sub] = await db
    .select({
      status: schema.subscriptions.status,
      periodEnd: schema.subscriptions.periodEnd,
      cancelAtPeriodEnd: schema.subscriptions.cancelAtPeriodEnd,
    })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.referenceId, organizationId))
    .orderBy(schema.subscriptions.periodEnd)
    .limit(1);

  const subscriptionStatus = sub?.status ?? null;
  const subActive = subscriptionStatus
    ? (ACTIVE_STATUSES as readonly string[]).includes(subscriptionStatus)
    : false;

  return {
    hasAccess: subActive || trialActive,
    trialEndsAt,
    trialActive,
    subscriptionStatus,
    periodEnd: sub?.periodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
  };
}

export async function hasActiveAccess(
  organizationId: string,
): Promise<boolean> {
  // Cheap path: skip loading period/cancel fields if callers only need yes/no.
  const [sub] = await db
    .select({ status: schema.subscriptions.status })
    .from(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.referenceId, organizationId),
        inArray(schema.subscriptions.status, ACTIVE_STATUSES as unknown as string[]),
      ),
    )
    .limit(1);
  if (sub) return true;

  const [org] = await db
    .select({ trialEndsAt: schema.organizations.trialEndsAt })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);
  return !!org && org.trialEndsAt.getTime() > Date.now();
}

/**
 * Thrown by `requirePaidAction` when an org has neither an active Stripe sub
 * nor a running trial. Route handlers catch it and convert to a 402 JSON
 * body that clients recognise via `code === "PAYWALL"`.
 */
export class PaywallError extends Error {
  constructor(public readonly organizationId: string) {
    super("Premium required");
    this.name = "PaywallError";
  }

  toResponse(): NextResponse {
    return NextResponse.json(
      {
        error: "Premium required",
        code: "PAYWALL",
        organizationId: this.organizationId,
      },
      { status: 402 },
    );
  }
}

export async function requirePaidAction(
  organizationId: string,
): Promise<void> {
  if (!(await hasActiveAccess(organizationId))) {
    throw new PaywallError(organizationId);
  }
}
