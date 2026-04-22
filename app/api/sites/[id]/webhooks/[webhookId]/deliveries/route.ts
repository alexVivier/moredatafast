import { NextResponse } from "next/server";
import { and, desc, eq, lt } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { OrgAuthError, requireOrgMember } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; webhookId: string }> },
) {
  let organizationId: string;
  try {
    ({ organizationId } = await requireOrgMember(request.headers));
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    throw err;
  }

  const { id: siteId, webhookId } = await context.params;
  const [ownership] = await db
    .select({ id: schema.webhooks.id })
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
  if (!ownership) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const beforeParam = url.searchParams.get("before");
  const before = beforeParam ? new Date(beforeParam) : null;

  const where =
    before && !isNaN(before.getTime())
      ? and(
          eq(schema.webhookDeliveries.webhookId, webhookId),
          lt(schema.webhookDeliveries.attemptedAt, before),
        )
      : eq(schema.webhookDeliveries.webhookId, webhookId);

  const rows = await db
    .select({
      id: schema.webhookDeliveries.id,
      event: schema.webhookDeliveries.event,
      status: schema.webhookDeliveries.status,
      statusCode: schema.webhookDeliveries.statusCode,
      durationMs: schema.webhookDeliveries.durationMs,
      error: schema.webhookDeliveries.error,
      attemptedAt: schema.webhookDeliveries.attemptedAt,
      responseBody: schema.webhookDeliveries.responseBody,
    })
    .from(schema.webhookDeliveries)
    .where(where)
    .orderBy(desc(schema.webhookDeliveries.attemptedAt))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor =
    hasMore && page.length > 0
      ? page[page.length - 1].attemptedAt.toISOString()
      : null;

  return NextResponse.json({ deliveries: page, nextCursor });
}
