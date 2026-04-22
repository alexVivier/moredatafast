import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, schema } from "@/db/client";
import { OrgAuthError, requireOrgMember } from "@/lib/auth/session";
import { PaywallError, requirePaidSubscription } from "@/lib/billing/gating";
import { dispatchOne, type DispatchTarget } from "@/lib/webhooks/dispatcher";
import type { WebhookEnvelope, WebhookEvent } from "@/lib/webhooks/events";
import { isWebhookEvent } from "@/lib/webhooks/events";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; webhookId: string }> },
) {
  let organizationId: string;
  try {
    ({ organizationId } = await requireOrgMember(request.headers, "admin"));
    await requirePaidSubscription(organizationId);
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    if (err instanceof PaywallError) return err.toResponse();
    throw err;
  }

  const { id: siteId, webhookId } = await context.params;
  const [row] = await db
    .select({
      webhook: schema.webhooks,
      site: {
        id: schema.sites.id,
        name: schema.sites.name,
        domain: schema.sites.domain,
      },
    })
    .from(schema.webhooks)
    .innerJoin(schema.sites, eq(schema.sites.id, schema.webhooks.siteId))
    .where(
      and(
        eq(schema.webhooks.id, webhookId),
        eq(schema.webhooks.siteId, siteId),
        eq(schema.sites.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  // Use the first subscribed event as the test event, defaulting to
  // payment.received (the headline feature).
  let subscribed: string[] = [];
  try {
    const parsed = JSON.parse(row.webhook.events);
    if (Array.isArray(parsed))
      subscribed = parsed.filter((v): v is string => typeof v === "string");
  } catch {}
  const event: WebhookEvent = isWebhookEvent(subscribed[0])
    ? subscribed[0]
    : "payment.received";

  const envelope: WebhookEnvelope<WebhookEvent, Record<string, unknown>> = {
    id: nanoid(16),
    event,
    createdAt: new Date().toISOString(),
    site: row.site,
    data: testPayloadFor(event),
  };

  const target: DispatchTarget = {
    id: row.webhook.id,
    url: row.webhook.url,
    secretEncrypted: row.webhook.secretEncrypted,
  };
  const result = await dispatchOne(
    target,
    event,
    envelope as unknown as Record<string, unknown>,
  );
  return NextResponse.json({
    ok: result.ok,
    statusCode: result.statusCode,
    error: result.error ?? null,
    event,
  });
}

function testPayloadFor(event: WebhookEvent): Record<string, unknown> {
  if (event === "payment.received") {
    return {
      sourceId: "test_payment",
      amount: 4900,
      currency: "USD",
      customer: { name: "Jane Doe", email: "jane@example.com" },
      isRenewal: false,
      occurredAt: new Date().toISOString(),
      _test: true,
    };
  }
  if (event === "event.custom") {
    return {
      sourceId: "test_event",
      type: "signup",
      path: "/pricing",
      countryCode: "US",
      referrer: null,
      amount: null,
      extra: { plan: "pro" },
      customer: { name: "Jane Doe", displayName: "Jane" },
      occurredAt: new Date().toISOString(),
      _test: true,
    };
  }
  // report.daily
  return {
    periodStart: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    periodEnd: new Date().toISOString(),
    visitors: 1234,
    sessions: 1580,
    revenue: 4900,
    currency: "USD",
    conversionRate: 0.042,
    bounceRate: 0.38,
    avgSessionDuration: 122,
    _test: true,
  };
}
