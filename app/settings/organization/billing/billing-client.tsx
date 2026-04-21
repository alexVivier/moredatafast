"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";

type Props = {
  organizationId: string;
  subscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean;
};

const ACTIVE = new Set(["active", "trialing"]);

export function BillingClient({
  organizationId,
  subscriptionStatus,
  cancelAtPeriodEnd,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<"month" | "year">("month");

  const hasActive = subscriptionStatus
    ? ACTIVE.has(subscriptionStatus)
    : false;
  const isPastDue =
    subscriptionStatus === "past_due" || subscriptionStatus === "unpaid";

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
      if (res.error) setError(res.error.message || "Failed to start checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
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
      if (res.error) setError(res.error.message || "Failed to open portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open portal");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (
      !window.confirm(
        "Cancel the subscription at the end of the current billing period? You'll keep access until then.",
      )
    )
      return;
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
        setError(res.error.message || "Failed to cancel");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
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
        setError(res.error.message || "Failed to restore");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore");
    } finally {
      setBusy(false);
    }
  }

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
              <h3 className="text-sm font-semibold">Subscribe to Premium</h3>
              <p className="text-xs text-muted-foreground">
                One plan, unlocks unlimited sites and teammates for the org.
              </p>
            </div>
            <div className="flex rounded-md border border-border p-0.5">
              <button
                type="button"
                onClick={() => setInterval("month")}
                className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition ${
                  interval === "month"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setInterval("year")}
                className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition ${
                  interval === "year"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                Yearly
              </button>
            </div>
            <Button onClick={upgrade} disabled={busy} className="w-full">
              {busy ? "Redirecting…" : "Subscribe"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {hasActive || isPastDue ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Manage billing</h3>
              <p className="text-xs text-muted-foreground">
                Update your card, download invoices, or change plan.
              </p>
            </div>
            <Button variant="outline" onClick={openPortal} disabled={busy}>
              {busy ? "Opening…" : "Open billing portal"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {hasActive && !cancelAtPeriodEnd ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Cancel subscription</h3>
              <p className="text-xs text-muted-foreground">
                Cancels at the end of the current period. No refund for the
                remaining days.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={cancel}
              disabled={busy}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {hasActive && cancelAtPeriodEnd ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Resume subscription</h3>
              <p className="text-xs text-muted-foreground">
                The subscription is scheduled to cancel. Restore it to stay on
                Premium.
              </p>
            </div>
            <Button onClick={restore} disabled={busy}>
              Resume
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
