import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
import { getPlanPrices } from "@/lib/billing/prices";

import { BillingClient } from "./billing-client";

export const dynamic = "force-dynamic";

type Search = { success?: string; canceled?: string };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { organizationId, role, billing } = await requirePageOrg(
    "/settings/organization/billing",
    "admin",
  );
  const t = await getTranslations("settings.billing");
  const tHeader = await getTranslations("settings.header");
  const tOrg = await getTranslations("settings.organization");

  const [org] = await db
    .select({ name: schema.organizations.name })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);

  const { success, canceled } = await searchParams;
  const prices = await getPlanPrices();

  const roleLabel = tOrg(
    `role${role.charAt(0).toUpperCase()}${role.slice(1)}` as
      | "roleOwner"
      | "roleAdmin"
      | "roleMember",
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center gap-2">
        <Link href="/settings/organization">
          <Button variant="ghost" size="sm">
            {tHeader("back")}
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {t("titleWithOrg", { org: org?.name ?? t("titleFallback") })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("lead", { role: roleLabel })}
        </p>
      </div>

      {success ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          {t("toastSuccess")}
        </div>
      ) : null}
      {canceled ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          {t("toastCanceled")}
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
        monthlyPriceLabel={prices.monthly?.display ?? null}
        yearlyPriceLabel={prices.yearly?.display ?? null}
        yearlySavingsPercent={prices.yearlySavingsPercent}
      />
    </div>
  );
}

async function StatusCard({
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
  const t = await getTranslations("settings.billing");
  let title = t("statusNoSub");
  let description: React.ReactNode = null;
  let tone = "border-border";

  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    title =
      subscriptionStatus === "trialing" ? t("statusTrial") : t("statusActive");
    tone = "border-emerald-500/30 bg-emerald-500/5";
    description = (
      <>
        {cancelAtPeriodEnd ? (
          t("statusScheduledCancel", {
            date: periodEnd ? periodEnd.toLocaleDateString() : "—",
          })
        ) : periodEnd ? (
          t("statusNextBilling", { date: periodEnd.toLocaleDateString() })
        ) : null}
      </>
    );
  } else if (
    subscriptionStatus === "past_due" ||
    subscriptionStatus === "unpaid"
  ) {
    title = t("statusPastDue");
    tone = "border-destructive/40 bg-destructive/10";
    description = <>{t("statusPastDueBody")}</>;
  } else if (trialActive) {
    const days = Math.max(
      0,
      Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
    title = t(days === 1 ? "statusFreeTrial" : "statusFreeTrialPlural", {
      days,
    });
    tone = "border-blue-500/30 bg-blue-500/5";
    description = (
      <>{t("statusTrialBody", { date: trialEndsAt.toLocaleDateString() })}</>
    );
  } else {
    title = t("statusTrialEnded");
    tone = "border-destructive/40 bg-destructive/10";
    description = <>{t("statusTrialEndedBody")}</>;
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
