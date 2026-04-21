"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";

type Props = {
  organizationId: string;
  subscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean;
  monthlyPriceLabel?: string | null;
  yearlyPriceLabel?: string | null;
  yearlySavingsPercent?: number | null;
};

const ACTIVE = new Set(["active", "trialing"]);

export function BillingClient({
  organizationId,
  subscriptionStatus,
  cancelAtPeriodEnd,
  monthlyPriceLabel,
  yearlyPriceLabel,
  yearlySavingsPercent,
}: Props) {
  const t = useTranslations("settings.billing");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<"month" | "year">("month");

  const hasActive = subscriptionStatus
    ? ACTIVE.has(subscriptionStatus)
    : false;
  const isPastDue =
    subscriptionStatus === "past_due" || subscriptionStatus === "unpaid";
  const yearlyAvailable = !!yearlyPriceLabel;

  async function upgrade() {
    setBusy(true);
    setError(null);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const res = await authClient.subscription.upgrade({
        plan: "premium",
        referenceId: organizationId,
        annual: interval === "year",
        successUrl: `${origin}/settings/organization/billing?success=1`,
        cancelUrl: `${origin}/settings/organization/billing?canceled=1`,
      });
      if (res.error) setError(res.error.message || t("errCheckout"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errCheckout"));
    } finally {
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.subscription.billingPortal({
        referenceId: organizationId,
        returnUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/settings/organization/billing`
            : undefined,
      });
      if (res.error) setError(res.error.message || t("errPortal"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errPortal"));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!window.confirm(t("confirmCancel"))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.subscription.cancel({
        referenceId: organizationId,
        returnUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/settings/organization/billing`
            : "",
      });
      if (res.error) {
        setError(res.error.message || t("errCancel"));
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errCancel"));
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.subscription.restore({
        referenceId: organizationId,
      });
      if (res.error) {
        setError(res.error.message || t("errRestore"));
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errRestore"));
    } finally {
      setBusy(false);
    }
  }

  const subscribePrice =
    interval === "year" && yearlyPriceLabel
      ? yearlyPriceLabel
      : (monthlyPriceLabel ?? t("subscribeFallback"));

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!hasActive && !isPastDue ? (
        <Card>
          <CardContent className="space-y-4 pt-4">
            <div>
              <h3 className="text-sm font-semibold">{t("subscribeTitle")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("subscribeBody")}
              </p>
            </div>
            <div className="flex rounded-md border border-border p-0.5">
              <button
                type="button"
                onClick={() => setInterval("month")}
                className={`flex-1 rounded px-3 py-2 text-xs font-medium transition ${
                  interval === "month"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                <div className="font-semibold">{t("monthly")}</div>
                {monthlyPriceLabel ? (
                  <div className="mt-0.5 text-[10px] opacity-80">
                    {monthlyPriceLabel}
                  </div>
                ) : null}
              </button>
              {yearlyAvailable ? (
                <button
                  type="button"
                  onClick={() => setInterval("year")}
                  className={`flex-1 rounded px-3 py-2 text-xs font-medium transition ${
                    interval === "year"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 font-semibold">
                    {t("yearly")}
                    {yearlySavingsPercent && yearlySavingsPercent > 0 ? (
                      <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] text-emerald-600 dark:text-emerald-400">
                        -{yearlySavingsPercent}%
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-[10px] opacity-80">
                    {yearlyPriceLabel}
                  </div>
                </button>
              ) : null}
            </div>
            <Button onClick={upgrade} disabled={busy} className="w-full">
              {busy
                ? t("redirecting")
                : t("subscribeCta", { price: subscribePrice })}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {hasActive || isPastDue ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("manageTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("manageBody")}</p>
            </div>
            <Button variant="outline" onClick={openPortal} disabled={busy}>
              {busy ? t("opening") : t("managePortal")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {hasActive && !cancelAtPeriodEnd ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("cancelTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("cancelBody")}</p>
            </div>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={cancel}
              disabled={busy}
            >
              {t("cancelCta")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {hasActive && cancelAtPeriodEnd ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("resumeTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("resumeBody")}</p>
            </div>
            <Button onClick={restore} disabled={busy}>
              {t("resumeCta")}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
