import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { db, schema } from "@/db/client";
import { OrgAuthError, requireOrgMember } from "@/lib/auth/session";
import { PaywallError, requirePaidSubscription } from "@/lib/billing/gating";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";
import { encryptSecret, generateSecret } from "@/lib/webhooks/crypto";

export const dynamic = "force-dynamic";

const urlSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (u) => {
      try {
        const parsed = new URL(u);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "URL must use http(s)" },
  );

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  url: urlSchema,
  events: z
    .array(z.enum(WEBHOOK_EVENTS))
    .min(1, "Pick at least one event"),
});

async function assertSiteOwnership(
  organizationId: string,
  siteId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.sites.id })
    .from(schema.sites)
    .where(
      and(
        eq(schema.sites.id, siteId),
        eq(schema.sites.organizationId, organizationId),
      ),
    )
    .limit(1);
  return !!row;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let organizationId: string;
  try {
    ({ organizationId } = await requireOrgMember(request.headers));
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    throw err;
  }
  const { id: siteId } = await context.params;
  if (!(await assertSiteOwnership(organizationId, siteId))) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const rows = await db
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
    .orderBy(desc(schema.webhooks.createdAt));

  return NextResponse.json({
    webhooks: rows.map((r) => ({
      ...r,
      events: safeParseEvents(r.events),
    })),
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let organizationId: string;
  let userId: string;
  try {
    ({ organizationId, userId } = await requireOrgMember(
      request.headers,
      "admin",
    ));
    await requirePaidSubscription(organizationId);
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    if (err instanceof PaywallError) return err.toResponse();
    throw err;
  }

  const { id: siteId } = await context.params;
  if (!(await assertSiteOwnership(organizationId, siteId))) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const webhookId = nanoid(12);
  const plaintextSecret = generateSecret();

  await db.insert(schema.webhooks).values({
    id: webhookId,
    siteId,
    organizationId,
    name: parsed.data.name,
    url: parsed.data.url,
    events: JSON.stringify(parsed.data.events),
    secretEncrypted: encryptSecret(plaintextSecret),
    enabled: true,
    createdBy: userId,
  });

  // Secret returned exactly once, at creation. UI should tell the user to
  // copy it now — subsequent reads won't expose it.
  return NextResponse.json({
    webhook: {
      id: webhookId,
      name: parsed.data.name,
      url: parsed.data.url,
      events: parsed.data.events,
      enabled: true,
    },
    secret: plaintextSecret,
  });
}

function safeParseEvents(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}
