import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
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

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  url: urlSchema.optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
  enabled: z.boolean().optional(),
  rotateSecret: z.boolean().optional(),
});

async function loadOwned(
  organizationId: string,
  siteId: string,
  webhookId: string,
) {
  const [row] = await db
    .select()
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
  return row?.webhooks ?? null;
}

export async function PATCH(
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
  const existing = await loadOwned(organizationId, siteId, webhookId);
  if (!existing) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.url !== undefined) update.url = parsed.data.url;
  if (parsed.data.events !== undefined)
    update.events = JSON.stringify(parsed.data.events);
  if (parsed.data.enabled !== undefined) {
    update.enabled = parsed.data.enabled;
    // Manual re-enable clears the auto-disable state and failure counter so
    // the next tick gives the endpoint a fresh shot.
    if (parsed.data.enabled) {
      update.disabledAt = null;
      update.disabledReason = null;
      update.failureCount = 0;
      update.lastError = null;
    }
  }

  let newSecret: string | null = null;
  if (parsed.data.rotateSecret) {
    newSecret = generateSecret();
    update.secretEncrypted = encryptSecret(newSecret);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await db
    .update(schema.webhooks)
    .set(update)
    .where(eq(schema.webhooks.id, webhookId));

  return NextResponse.json({
    ok: true,
    ...(newSecret ? { secret: newSecret } : {}),
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; webhookId: string }> },
) {
  let organizationId: string;
  try {
    ({ organizationId } = await requireOrgMember(request.headers, "admin"));
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    throw err;
  }

  const { id: siteId, webhookId } = await context.params;
  const existing = await loadOwned(organizationId, siteId, webhookId);
  if (!existing) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  await db.delete(schema.webhooks).where(eq(schema.webhooks.id, webhookId));
  return NextResponse.json({ ok: true });
}
