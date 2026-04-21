"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PaywallDialog } from "@/components/billing/paywall-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddSiteFormProps = {
  monthlyPriceLabel?: string | null;
  yearlyPriceLabel?: string | null;
  yearlySavingsPercent?: number | null;
};

export function AddSiteForm({
  monthlyPriceLabel,
  yearlyPriceLabel,
  yearlySavingsPercent,
}: AddSiteFormProps = {}) {
  const t = useTranslations("settings.siteNew");
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [nameOverride, setNameOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywallOrgId, setPaywallOrgId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          nameOverride: nameOverride.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 402 || body?.code === "PAYWALL") {
        setPaywallOrgId(body.organizationId ?? "");
        return;
      }
      if (!res.ok) {
        setError(body.error || t("errRequest", { status: res.status }));
        return;
      }
      if (body.viewId) {
        router.push(`/view/${body.viewId}`);
      } else {
        router.push("/settings");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errNetwork"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PaywallDialog
        open={paywallOrgId !== null}
        onClose={() => setPaywallOrgId(null)}
        organizationId={paywallOrgId ?? ""}
        reason={t("paywallReason")}
        monthlyPriceLabel={monthlyPriceLabel}
        yearlyPriceLabel={yearlyPriceLabel}
        yearlySavingsPercent={yearlySavingsPercent}
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">{t("apiKey")}</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={t("apiKeyPlaceholder")}
                required
                autoFocus
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t("displayName")}</Label>
              <Input
                id="name"
                placeholder={t("displayNamePlaceholder")}
                value={nameOverride}
                onChange={(e) => setNameOverride(e.target.value)}
              />
            </div>

            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={submitting || apiKey.length < 8}>
                {submitting ? t("submitting") : t("submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
