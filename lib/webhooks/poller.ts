import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, schema } from "@/db/client";
import { decrypt } from "@/lib/crypto/keyring";
import { fetchDataFast } from "@/lib/datafast/client";
import type {
  RealtimeEvent,
  RealtimeMapData,
  RealtimePayment,
} from "@/lib/datafast/realtime-types";
import type { OverviewRow } from "@/lib/datafast/types";
import { hasPaidSubscription } from "@/lib/billing/gating";

import { dispatchOne, type DispatchTarget } from "./dispatcher";
import type {
  CustomEventData,
  DailyReportData,
  PaymentReceivedData,
  WebhookEnvelope,
  WebhookEvent,
} from "./events";
import { WEBHOOK_EVENTS } from "./events";

type WebhookRow = {
  id: string;
  siteId: string;
  organizationId: string;
  url: string;
  events: string[];
  secretEncrypted: string;
};

type SiteRow = {
  id: string;
  organizationId: string;
  name: string;
  domain: string;
  apiKeyEncrypted: string;
  timezone: string;
  currency: string;
};

export type PollResult = {
  sitesProcessed: number;
  sitesSkipped: number;
  webhooksFired: number;
  errors: number;
};

/**
 * Poll loop entrypoint. Called from the cron route every minute. Idempotent:
 * cursors ensure each realtime event fires at most once; daily report is
 * gated by the `report.daily` cursor rather than wall-clock time.
 */
export async function runWebhookPoll(): Promise<PollResult> {
  const result: PollResult = {
    sitesProcessed: 0,
    sitesSkipped: 0,
    webhooksFired: 0,
    errors: 0,
  };

  const active = await loadActiveWebhooks();
  if (active.size === 0) return result;

  const siteIds = [...active.keys()];
  const siteRows = await db
    .select({
      id: schema.sites.id,
      organizationId: schema.sites.organizationId,
      name: schema.sites.name,
      domain: schema.sites.domain,
      apiKeyEncrypted: schema.sites.apiKeyEncrypted,
      timezone: schema.sites.timezone,
      currency: schema.sites.currency,
    })
    .from(schema.sites)
    .where(inArray(schema.sites.id, siteIds));

  // Cache paid-status per org so we don't hit billing twice for sites of the
  // same org. Defence in depth — the CRUD endpoints already gate creation.
  const orgAccess = new Map<string, boolean>();

  for (const site of siteRows) {
    const hooks = active.get(site.id);
    if (!hooks || hooks.length === 0) continue;

    let paid = orgAccess.get(site.organizationId);
    if (paid === undefined) {
      paid = await hasPaidSubscription(site.organizationId);
      orgAccess.set(site.organizationId, paid);
    }
    if (!paid) {
      result.sitesSkipped += 1;
      continue;
    }

    try {
      const fired = await processSite(site, hooks);
      result.sitesProcessed += 1;
      result.webhooksFired += fired;
    } catch (err) {
      console.error(`[webhook-poller] site ${site.id} failed:`, err);
      result.errors += 1;
    }
  }

  return result;
}

async function loadActiveWebhooks(): Promise<Map<string, WebhookRow[]>> {
  const rows = await db
    .select({
      id: schema.webhooks.id,
      siteId: schema.webhooks.siteId,
      organizationId: schema.webhooks.organizationId,
      url: schema.webhooks.url,
      events: schema.webhooks.events,
      secretEncrypted: schema.webhooks.secretEncrypted,
    })
    .from(schema.webhooks)
    .where(eq(schema.webhooks.enabled, true));

  const bySite = new Map<string, WebhookRow[]>();
  for (const r of rows) {
    let events: string[] = [];
    try {
      const parsed = JSON.parse(r.events);
      if (Array.isArray(parsed))
        events = parsed.filter((e): e is string => typeof e === "string");
    } catch {
      events = [];
    }
    if (events.length === 0) continue;
    const list = bySite.get(r.siteId) ?? [];
    list.push({ ...r, events });
    bySite.set(r.siteId, list);
  }
  return bySite;
}

async function processSite(
  site: SiteRow,
  hooks: WebhookRow[],
): Promise<number> {
  let apiKey: string;
  try {
    apiKey = decrypt(site.apiKeyEncrypted);
  } catch {
    return 0;
  }

  const wantsRealtime = hooks.some((h) =>
    h.events.some(
      (e) => e === "payment.received" || e === "event.custom",
    ),
  );
  const wantsDaily = hooks.some((h) => h.events.includes("report.daily"));

  let fired = 0;

  if (wantsRealtime) {
    fired += await processRealtime(site, apiKey, hooks);
  }
  if (wantsDaily) {
    fired += await processDaily(site, apiKey, hooks);
  }

  return fired;
}

async function processRealtime(
  site: SiteRow,
  apiKey: string,
  hooks: WebhookRow[],
): Promise<number> {
  const res = await fetchDataFast<RealtimeMapData>(
    apiKey,
    "analytics/realtime/map",
    { revalidate: false },
  );
  const body = res.data;
  if (!body) return 0;

  let fired = 0;
  fired += await processPayments(site, body.recentPayments ?? [], hooks);
  fired += await processEvents(site, body.recentEvents ?? [], hooks);
  return fired;
}

async function processPayments(
  site: SiteRow,
  payments: RealtimePayment[],
  hooks: WebhookRow[],
): Promise<number> {
  const subscribers = hooks.filter((h) => h.events.includes("payment.received"));
  if (subscribers.length === 0 || payments.length === 0) return 0;

  const cursor = await getCursor(site.id, "payment.received");
  const cursorMs = cursor?.lastSeenAt?.getTime() ?? 0;

  // DataFast returns newest first — sort ascending so cursor advances cleanly.
  const chrono = [...payments].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  let fired = 0;
  let newestMs = cursorMs;
  let newestId = cursor?.lastEventId ?? null;

  for (const p of chrono) {
    const ts = new Date(p.timestamp).getTime();
    if (ts <= cursorMs) continue;

    const data: PaymentReceivedData = {
      sourceId: p._id,
      amount: p.amount,
      currency: p.currency,
      customer: { name: p.name ?? null, email: p.email ?? null },
      isRenewal: !!p.renewal,
      occurredAt: p.timestamp,
    };
    fired += await fanout(site, subscribers, "payment.received", data);

    if (ts > newestMs) {
      newestMs = ts;
      newestId = p._id;
    }
  }

  if (newestMs > cursorMs) {
    await upsertCursor(site.id, "payment.received", newestId, new Date(newestMs));
  }
  return fired;
}

async function processEvents(
  site: SiteRow,
  events: RealtimeEvent[],
  hooks: WebhookRow[],
): Promise<number> {
  const subscribers = hooks.filter((h) => h.events.includes("event.custom"));
  if (subscribers.length === 0 || events.length === 0) return 0;

  // Custom events only — skip pageviews, which are noisy and not what
  // integrations want.
  const custom = events.filter((e) => e.type !== "pageview");
  if (custom.length === 0) return 0;

  const cursor = await getCursor(site.id, "event.custom");
  const cursorMs = cursor?.lastSeenAt?.getTime() ?? 0;

  const chrono = [...custom].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  let fired = 0;
  let newestMs = cursorMs;
  let newestId = cursor?.lastEventId ?? null;

  for (const e of chrono) {
    const ts = new Date(e.timestamp).getTime();
    if (ts <= cursorMs) continue;

    const data: CustomEventData = {
      sourceId: e._id,
      type: e.type,
      path: e.path ?? null,
      countryCode: e.countryCode ?? null,
      referrer: e.referrer ?? null,
      amount: e.amount ?? null,
      extra: (e.extraData ?? {}) as Record<string, unknown>,
      customer: {
        name: e.customerName ?? null,
        displayName: e.displayName ?? null,
      },
      occurredAt: e.timestamp,
    };
    fired += await fanout(site, subscribers, "event.custom", data);

    if (ts > newestMs) {
      newestMs = ts;
      newestId = e._id;
    }
  }

  if (newestMs > cursorMs) {
    await upsertCursor(site.id, "event.custom", newestId, new Date(newestMs));
  }
  return fired;
}

async function processDaily(
  site: SiteRow,
  apiKey: string,
  hooks: WebhookRow[],
): Promise<number> {
  const subscribers = hooks.filter((h) => h.events.includes("report.daily"));
  if (subscribers.length === 0) return 0;

  const cursor = await getCursor(site.id, "report.daily");
  const now = new Date();

  // Close of the most recent UTC day — reports fire at the top of the next
  // day so "yesterday's numbers" are complete.
  const todayStartUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const yesterdayStartUtc = todayStartUtc - 24 * 3600 * 1000;

  if (cursor?.lastSeenAt && cursor.lastSeenAt.getTime() >= todayStartUtc) {
    return 0;
  }

  const from = new Date(yesterdayStartUtc).toISOString();
  const to = new Date(todayStartUtc - 1).toISOString();

  let overview: OverviewRow | null = null;
  try {
    const res = await fetchDataFast<OverviewRow[]>(
      apiKey,
      "analytics/overview",
      {
        searchParams: { from, to, timezone: site.timezone },
        revalidate: false,
      },
    );
    overview = res.data?.[0] ?? null;
  } catch (err) {
    console.error(`[webhook-poller] overview for ${site.id}:`, err);
    return 0;
  }
  if (!overview) return 0;

  const data: DailyReportData = {
    periodStart: from,
    periodEnd: to,
    visitors: overview.visitors ?? 0,
    sessions: overview.sessions ?? 0,
    revenue: overview.revenue ?? 0,
    currency: overview.currency ?? site.currency,
    conversionRate: overview.conversion_rate ?? 0,
    bounceRate: overview.bounce_rate ?? 0,
    avgSessionDuration: overview.avg_session_duration ?? 0,
  };

  const fired = await fanout(site, subscribers, "report.daily", data);

  await upsertCursor(
    site.id,
    "report.daily",
    null,
    new Date(todayStartUtc),
  );
  return fired;
}

async function fanout<E extends WebhookEvent, D>(
  site: SiteRow,
  subscribers: WebhookRow[],
  event: E,
  data: D,
): Promise<number> {
  let ok = 0;
  for (const w of subscribers) {
    const envelope: WebhookEnvelope<E, D> = {
      id: nanoid(16),
      event,
      createdAt: new Date().toISOString(),
      site: { id: site.id, domain: site.domain, name: site.name },
      data,
    };
    const target: DispatchTarget = {
      id: w.id,
      url: w.url,
      secretEncrypted: w.secretEncrypted,
    };
    const r = await dispatchOne(
      target,
      event,
      envelope as unknown as Record<string, unknown>,
    );
    if (r.ok) ok += 1;
  }
  return ok;
}

async function getCursor(siteId: string, eventType: string) {
  const [row] = await db
    .select()
    .from(schema.webhookCursors)
    .where(
      and(
        eq(schema.webhookCursors.siteId, siteId),
        eq(schema.webhookCursors.eventType, eventType),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function upsertCursor(
  siteId: string,
  eventType: string,
  lastEventId: string | null,
  lastSeenAt: Date,
) {
  const existing = await getCursor(siteId, eventType);
  if (existing) {
    await db
      .update(schema.webhookCursors)
      .set({ lastEventId, lastSeenAt, updatedAt: new Date() })
      .where(eq(schema.webhookCursors.id, existing.id));
  } else {
    await db.insert(schema.webhookCursors).values({
      id: nanoid(12),
      siteId,
      eventType,
      lastEventId,
      lastSeenAt,
    });
  }
}

export const _supportedEvents = WEBHOOK_EVENTS;
