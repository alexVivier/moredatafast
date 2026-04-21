import Link from "next/link";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePageOrg } from "@/lib/auth/session";

import { BillingClient } from "./billing-client";

export const dynamic = "force-dynamic";

type Search = { success?: string; canceled?: string };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  // Admin/owner only — members don't manage billing.
  const { organizationId, role, billing } = await requirePageOrg(
    "/settings/organization/billing",
    "admin",
  );

  const [org] = await db
    .select({ name: schema.organizations.name })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);

  const { success, canceled } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center gap-2">
        <Link href="/settings/organization">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          Billing — {org?.name ?? "Organization"}
        </h1>
        <p className="text-sm text-muted-foreground">
          One subscription per organization. Members with role{" "}
          <span className="font-medium">{role}</span> can manage it.
        </p>
      </div>

      {success ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          Subscription active — welcome to Premium.
        </div>
      ) : null}
      {canceled ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          Checkout canceled. You can resume any time below.
        </div>
      ) : null}

      <StatusCard
        trialEndsAt={billing.trialEndsAt}
        trialActive={billing.trialActive}
        subscriptionStatus={billing.subscriptionStatus}
        periodEnd={billing.periodEnd}
        cancelAtPeriodEnd={billing.cancelAtPeriodEnd}
      />

      <BillingClient
        organizationId={organizationId}
        subscriptionStatus={billing.subscriptionStatus}
        cancelAtPeriodEnd={billing.cancelAtPeriodEnd}
      />
    </div>
  );
}

function StatusCard({
  trialEndsAt,
  trialActive,
  subscriptionStatus,
  periodEnd,
  cancelAtPeriodEnd,
}: {
  trialEndsAt: Date;
  trialActive: boolean;
  subscriptionStatus: string | null;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}) {
  let title = "No active subscription";
  let description: React.ReactNode = null;
  let tone = "border-border";

  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    title = subscriptionStatus === "trialing" ? "Premium — trial" : "Premium — active";
    tone = "border-emerald-500/30 bg-emerald-500/5";
    description = (
      <>
        {cancelAtPeriodEnd ? (
          <>
            Scheduled to cancel on{" "}
            <span className="font-medium">
              {periodEnd ? periodEnd.toLocaleDateString() : "—"}
            </span>
            . You&apos;ll keep access until then.
          </>
        ) : periodEnd ? (
          <>
            Next billing date:{" "}
            <span className="font-medium">{periodEnd.toLocaleDateString()}</span>
          </>
        ) : null}
      </>
    );
  } else if (
    subscriptionStatus === "past_due" ||
    subscriptionStatus === "unpaid"
  ) {
    title = "Payment failed";
    tone = "border-destructive/40 bg-destructive/10";
    description = (
      <>Update your card from the Stripe billing portal to restore access.</>
    );
  } else if (trialActive) {
    const days = Math.max(
      0,
      Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
    title = `Free trial — ${days} day${days === 1 ? "" : "s"} left`;
    tone = "border-blue-500/30 bg-blue-500/5";
    description = (
      <>
        Trial ends on{" "}
        <span className="font-medium">{trialEndsAt.toLocaleDateString()}</span>.
        Upgrade any time to keep adding sites and inviting teammates.
      </>
    );
  } else {
    title = "Trial ended";
    tone = "border-destructive/40 bg-destructive/10";
    description = (
      <>Subscribe to Premium to add sites or invite teammates.</>
    );
  }

  return (
    <Card className={tone}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
    </Card>
  );
}
