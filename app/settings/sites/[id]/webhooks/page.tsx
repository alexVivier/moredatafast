import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { and, eq } from "drizzle-orm";

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
import { hasPaidSubscription } from "@/lib/billing/gating";
import { getPlanPrices } from "@/lib/billing/prices";

import { WebhooksClient } from "./webhooks-client";

export const dynamic = "force-dynamic";

export default async function SiteWebhooksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: siteId } = await params;
  const { organizationId, role } = await requirePageOrg(
    `/settings/sites/${siteId}/webhooks`,
    "admin",
  );
  const t = await getTranslations("settings.webhooks");

  const [site] = await db
    .select({
      id: schema.sites.id,
      name: schema.sites.name,
      domain: schema.sites.domain,
    })
    .from(schema.sites)
    .where(
      and(
        eq(schema.sites.id, siteId),
        eq(schema.sites.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!site) notFound();

  const paid = await hasPaidSubscription(organizationId);
  const prices = await getPlanPrices();

  const rows = paid
    ? await db
        .select({
          id: schema.webhooks.id,
          name: schema.webhooks.name,
          url: schema.webhooks.url,
          events: schema.webhooks.events,
          enabled: schema.webhooks.enabled,
          failureCount: schema.webhooks.failureCount,
          disabledAt: schema.webhooks.disabledAt,
          disabledReason: schema.webhooks.disabledReason,
          lastFiredAt: schema.webhooks.lastFiredAt,
          lastSuccessAt: schema.webhooks.lastSuccessAt,
          lastError: schema.webhooks.lastError,
          createdAt: schema.webhooks.createdAt,
        })
        .from(schema.webhooks)
        .where(eq(schema.webhooks.siteId, siteId))
    : [];

  const canManage = role === "owner" || role === "admin";

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            {t("back")}
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
            {t("title")}
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            {site.name} · {site.domain}
          </p>
        </div>
      </div>

      {!paid ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("paywallTitle")}</CardTitle>
            <CardDescription>{t("paywallBody")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/settings/organization/billing">
              <Button variant="brand">
                {t("paywallCta", {
                  price: prices.monthly?.display ?? "",
                })}
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline">{t("paywallSecondary")}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <WebhooksClient
          siteId={site.id}
          canManage={canManage}
          initialWebhooks={rows.map((r) => ({
            ...r,
            events: safeParse(r.events),
            lastFiredAt: r.lastFiredAt?.toISOString() ?? null,
            lastSuccessAt: r.lastSuccessAt?.toISOString() ?? null,
            disabledAt: r.disabledAt?.toISOString() ?? null,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}

function safeParse(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}
