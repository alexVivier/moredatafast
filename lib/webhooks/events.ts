import "server-only";

export const WEBHOOK_EVENTS = [
  "payment.received",
  "event.custom",
  "report.daily",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function isWebhookEvent(v: unknown): v is WebhookEvent {
  return (
    typeof v === "string" &&
    (WEBHOOK_EVENTS as readonly string[]).includes(v)
  );
}

// Exported for the UI so it can show a translated label without duplicating the
// event list. i18n key convention: `settings.webhooks.events.<event>.title` and
// `.description`.
export const WEBHOOK_EVENT_I18N_BASE = "settings.webhooks.events" as const;

// ---- Payload shapes sent to user endpoints ------------------------------
// All envelopes share the same outer shell so integrations can dispatch on
// `event` without parsing twice.

export type WebhookEnvelope<T extends WebhookEvent, D> = {
  id: string; // delivery id — stable for redelivery dedup
  event: T;
  createdAt: string; // ISO
  site: { id: string; domain: string; name: string };
  data: D;
};

export type PaymentReceivedData = {
  sourceId: string; // DataFast `_id`
  amount: number;
  currency: string;
  customer: { name: string | null; email: string | null };
  isRenewal: boolean;
  occurredAt: string;
};

export type CustomEventData = {
  sourceId: string;
  type: string; // event type name from the DataFast SDK
  path: string | null;
  countryCode: string | null;
  referrer: string | null;
  amount: number | null;
  extra: Record<string, unknown>;
  customer: { name: string | null; displayName: string | null };
  occurredAt: string;
};

export type DailyReportData = {
  periodStart: string; // ISO — start of the UTC day just closed
  periodEnd: string;
  visitors: number;
  sessions: number;
  revenue: number;
  currency: string;
  conversionRate: number;
  bounceRate: number;
  avgSessionDuration: number;
};
