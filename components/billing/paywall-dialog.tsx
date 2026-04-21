"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

type Props = {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  /** Short reason copy injected into the title (already localised upstream). */
  reason: string;
  monthlyPriceLabel?: string | null;
  yearlyPriceLabel?: string | null;
  yearlySavingsPercent?: number | null;
};

export function PaywallDialog({
  open,
  onClose,
  organizationId,
  reason,
  monthlyPriceLabel,
  yearlyPriceLabel,
  yearlySavingsPercent,
}: Props) {
  const t = useTranslations("dialogs.paywall");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<"month" | "year">("month");

  const yearlyAvailable = !!yearlyPriceLabel;

  if (!open) return null;

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
      if (res.error) {
        setError(res.error.message || t("errCheckout"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errCheckout"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="mt-4 sm:mt-24 mx-3 sm:mx-0 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-lg border border-border bg-card text-card-foreground shadow-lg p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("body", { reason })}
          </p>
        </div>

        <div className="mb-4 flex rounded-md border border-border p-0.5">
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

        {error ? (
          <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            {t("notNow")}
          </Button>
          <Button onClick={upgrade} disabled={busy}>
            {busy ? t("redirecting") : t("upgrade")}
          </Button>
        </div>
      </div>
    </div>
  );
}
