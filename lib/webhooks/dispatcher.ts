import "server-only";

import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, schema } from "@/db/client";

import { decryptSecret, signPayload } from "./crypto";
import type { WebhookEvent } from "./events";

const DISPATCH_TIMEOUT_MS = 8_000;
const RESPONSE_BODY_MAX = 2048;
// After this many consecutive failures, the webhook is auto-disabled so we
// stop hammering dead URLs. User can re-enable in the UI.
const MAX_CONSECUTIVE_FAILURES = 10;

export type DispatchTarget = {
  id: string;
  url: string;
  secretEncrypted: string;
};

/**
 * Fire a single webhook and record the attempt. `deliveryId` is supplied so
 * the same value ends up in both the request envelope and the DB row — this
 * lets receivers dedupe on retries.
 */
export async function dispatchOne(
  target: DispatchTarget,
  event: WebhookEvent,
  envelope: Record<string, unknown>,
): Promise<{ ok: boolean; statusCode: number | null; error?: string }> {
  const deliveryId = (envelope.id as string) ?? nanoid(16);
  const rawBody = JSON.stringify(envelope);
  const tsSec = Math.floor(Date.now() / 1000);

  let secret: string;
  try {
    secret = decryptSecret(target.secretEncrypted);
  } catch (e) {
    const error = e instanceof Error ? e.message : "decrypt failed";
    await recordDelivery({
      deliveryId,
      webhookId: target.id,
      event,
      status: "failed",
      statusCode: null,
      requestBody: rawBody,
      responseBody: null,
      durationMs: 0,
      error,
    });
    await bumpFailure(target.id, error);
    return { ok: false, statusCode: null, error };
  }

  const signature = signPayload(secret, rawBody, tsSec);
  const started = Date.now();

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let error: string | undefined;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), DISPATCH_TIMEOUT_MS);
    const res = await fetch(target.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DataFast-Webhook/1.0",
        "X-DataFast-Event": event,
        "X-DataFast-Delivery": deliveryId,
        "X-DataFast-Signature": signature,
      },
      body: rawBody,
      signal: ctrl.signal,
      // Webhook URLs are user-supplied; disable Next fetch cache.
      cache: "no-store",
    });
    clearTimeout(timer);
    statusCode = res.status;
    const text = await res.text().catch(() => "");
    responseBody = text.slice(0, RESPONSE_BODY_MAX);
    if (!res.ok) {
      error = `HTTP ${res.status}`;
    }
  } catch (e) {
    error =
      e instanceof Error
        ? e.name === "AbortError"
          ? `timeout after ${DISPATCH_TIMEOUT_MS}ms`
          : e.message
        : "request failed";
  }

  const durationMs = Date.now() - started;
  const ok = !error;

  await recordDelivery({
    deliveryId,
    webhookId: target.id,
    event,
    status: ok ? "success" : "failed",
    statusCode,
    requestBody: rawBody,
    responseBody,
    durationMs,
    error: error ?? null,
  });

  if (ok) {
    await markSuccess(target.id);
  } else {
    await bumpFailure(target.id, error ?? "unknown error");
  }

  return { ok, statusCode, error };
}

async function recordDelivery(row: {
  deliveryId: string;
  webhookId: string;
  event: string;
  status: "success" | "failed" | "pending";
  statusCode: number | null;
  requestBody: string;
  responseBody: string | null;
  durationMs: number;
  error: string | null;
}) {
  await db.insert(schema.webhookDeliveries).values({
    id: row.deliveryId,
    webhookId: row.webhookId,
    event: row.event,
    status: row.status,
    statusCode: row.statusCode ?? null,
    requestBody: row.requestBody,
    responseBody: row.responseBody,
    durationMs: row.durationMs,
    error: row.error,
  });
}

async function markSuccess(webhookId: string) {
  await db
    .update(schema.webhooks)
    .set({
      failureCount: 0,
      lastFiredAt: new Date(),
      lastSuccessAt: new Date(),
      lastError: null,
    })
    .where(eq(schema.webhooks.id, webhookId));
}

async function bumpFailure(webhookId: string, reason: string) {
  const [row] = await db
    .update(schema.webhooks)
    .set({
      failureCount: sql`${schema.webhooks.failureCount} + 1`,
      lastFiredAt: new Date(),
      lastError: reason.slice(0, 500),
    })
    .where(eq(schema.webhooks.id, webhookId))
    .returning({ failureCount: schema.webhooks.failureCount });

  if (row && row.failureCount >= MAX_CONSECUTIVE_FAILURES) {
    await db
      .update(schema.webhooks)
      .set({
        enabled: false,
        disabledAt: new Date(),
        disabledReason: `Auto-disabled after ${row.failureCount} consecutive failures`,
      })
      .where(eq(schema.webhooks.id, webhookId));
  }
}
