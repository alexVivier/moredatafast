"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
import { useAlert, useConfirm } from "@/components/ui/confirm-dialog";

const ALL_EVENTS = ["payment.received", "event.custom", "report.daily"] as const;
type EventKey = (typeof ALL_EVENTS)[number];

type WebhookRow = {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  failureCount: number;
  disabledAt: string | null;
  disabledReason: string | null;
  lastFiredAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  createdAt: string;
};

export function WebhooksClient({
  siteId,
  canManage,
  initialWebhooks,
}: {
  siteId: string;
  canManage: boolean;
  initialWebhooks: WebhookRow[];
}) {
  const t = useTranslations("settings.webhooks");
  const tc = useTranslations("common");
  const router = useRouter();
  const alert = useAlert();
  const confirm = useConfirm();

  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [editing, setEditing] = useState<WebhookRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [secretToReveal, setSecretToReveal] = useState<{
    name: string;
    secret: string;
  } | null>(null);
  const [viewingDeliveries, setViewingDeliveries] = useState<WebhookRow | null>(
    null,
  );

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/sites/${siteId}/webhooks`);
    if (!res.ok) return;
    const body = await res.json();
    setWebhooks(body.webhooks ?? []);
  }, [siteId]);

  async function onTest(w: WebhookRow) {
    const res = await fetch(
      `/api/sites/${siteId}/webhooks/${w.id}/test`,
      { method: "POST" },
    );
    const body = await res.json().catch(() => ({}));
    if (body.ok) {
      await alert({
        title: t("testSuccessTitle"),
        description: t("testSuccessBody", {
          status: body.statusCode ?? "?",
          event: body.event ?? "",
        }),
        tone: "info",
      });
    } else {
      await alert({
        title: t("testFailedTitle"),
        description: t("testFailedBody", {
          status: body.statusCode ?? "—",
          error: body.error ?? "",
        }),
        tone: "danger",
      });
    }
    refresh();
  }

  async function onToggleEnabled(w: WebhookRow, next: boolean) {
    await fetch(`/api/sites/${siteId}/webhooks/${w.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    refresh();
  }

  async function onDelete(w: WebhookRow) {
    const ok = await confirm({
      title: t("deleteTitle"),
      description: t("deleteBody", { name: w.name }),
      confirmLabel: tc("delete"),
      tone: "danger",
    });
    if (!ok) return;
    await fetch(`/api/sites/${siteId}/webhooks/${w.id}`, { method: "DELETE" });
    refresh();
  }

  async function onRotate(w: WebhookRow) {
    const ok = await confirm({
      title: t("rotateTitle"),
      description: t("rotateBody"),
      confirmLabel: t("rotateConfirm"),
      tone: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/sites/${siteId}/webhooks/${w.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rotateSecret: true }),
    });
    const body = await res.json().catch(() => ({}));
    if (body.secret) {
      setSecretToReveal({ name: w.name, secret: body.secret });
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle>{t("listTitle")}</CardTitle>
            <CardDescription>{t("lead")}</CardDescription>
          </div>
          {canManage ? (
            <Button onClick={() => setCreating(true)}>{t("add")}</Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              {t("empty")}
            </div>
          ) : (
            <ul className="divide-y divide-mdf-line-1">
              {webhooks.map((w) => (
                <WebhookRowItem
                  key={w.id}
                  webhook={w}
                  canManage={canManage}
                  onEdit={() => setEditing(w)}
                  onDelete={() => onDelete(w)}
                  onTest={() => onTest(w)}
                  onToggleEnabled={(next) => onToggleEnabled(w, next)}
                  onRotate={() => onRotate(w)}
                  onViewDeliveries={() => setViewingDeliveries(w)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t("docsTitle")}</CardTitle>
          <CardDescription>{t("docsBody")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="font-mono text-xs text-mdf-fg-2 mb-1">
              X-DataFast-Signature
            </div>
            <p className="text-mdf-fg-2">{t("docsSignature")}</p>
          </div>
          <pre className="rounded-md bg-mdf-bg-input border border-mdf-line-1 p-3 text-[11px] overflow-auto font-mono leading-snug text-mdf-fg-1">
{`const signature = req.headers['x-datafast-signature'];
// "t=1738000000,v1=abc123..."
const [, ts, sig] = signature.match(/t=(\\d+),v1=([a-f0-9]+)/);
const expected = crypto
  .createHmac('sha256', process.env.DATAFAST_WHSEC)
  .update(ts + '.' + rawBody)
  .digest('hex');
if (!timingSafeEqual(expected, sig)) throw new Error('bad sig');`}
          </pre>
        </CardContent>
      </Card>

      {creating ? (
        <WebhookFormDialog
          mode="create"
          siteId={siteId}
          onClose={() => setCreating(false)}
          onSaved={(result) => {
            setCreating(false);
            refresh();
            router.refresh();
            if (result.secret) {
              setSecretToReveal({
                name: result.webhook.name,
                secret: result.secret,
              });
            }
          }}
        />
      ) : null}

      {editing ? (
        <WebhookFormDialog
          mode="edit"
          siteId={siteId}
          webhook={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      ) : null}

      {secretToReveal ? (
        <SecretRevealDialog
          name={secretToReveal.name}
          secret={secretToReveal.secret}
          onClose={() => setSecretToReveal(null)}
        />
      ) : null}

      {viewingDeliveries ? (
        <DeliveriesDialog
          siteId={siteId}
          webhook={viewingDeliveries}
          onClose={() => setViewingDeliveries(null)}
        />
      ) : null}
    </>
  );
}

function WebhookRowItem({
  webhook: w,
  canManage,
  onEdit,
  onDelete,
  onTest,
  onToggleEnabled,
  onRotate,
  onViewDeliveries,
}: {
  webhook: WebhookRow;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  onToggleEnabled: (next: boolean) => void;
  onRotate: () => void;
  onViewDeliveries: () => void;
}) {
  const t = useTranslations("settings.webhooks");
  const disabled = !w.enabled;

  return (
    <li className="py-3 flex flex-wrap items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{w.name}</span>
          {disabled ? (
            <span className="mdf-badge mdf-badge--warn text-[10px]">
              {t("disabled")}
            </span>
          ) : (
            <span className="mdf-badge mdf-badge--success text-[10px]">
              {t("enabled")}
            </span>
          )}
        </div>
        <div
          className="text-xs text-mdf-fg-3 truncate mt-0.5"
          style={{ fontFamily: "var(--mdf-font-mono)" }}
        >
          {w.url}
        </div>
        <div className="flex items-center gap-1 flex-wrap mt-1.5">
          {w.events.map((ev) => (
            <span key={ev} className="mdf-badge mdf-badge--info text-[10px]">
              {ev}
            </span>
          ))}
        </div>
        {w.lastError && disabled ? (
          <div className="text-[11px] text-mdf-danger mt-1.5 truncate">
            {w.disabledReason ?? w.lastError}
          </div>
        ) : null}
        {w.lastFiredAt ? (
          <div className="text-[11px] text-mdf-fg-3 mt-1">
            {t("lastFired", {
              ago: relativeTime(w.lastFiredAt),
              status: w.lastSuccessAt === w.lastFiredAt ? "ok" : "err",
            })}
          </div>
        ) : null}
      </div>
      {canManage ? (
        <div className="flex items-center gap-1 shrink-0 flex-wrap">
          <Button size="sm" variant="ghost" onClick={onViewDeliveries}>
            {t("deliveries")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onTest}>
            {t("test")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleEnabled(!w.enabled)}
          >
            {w.enabled ? t("disable") : t("enable")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit}>
            {t("edit")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onRotate}>
            {t("rotate")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-mdf-danger hover:text-mdf-danger"
          >
            {t("delete")}
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function WebhookFormDialog({
  mode,
  siteId,
  webhook,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  siteId: string;
  webhook?: WebhookRow;
  onClose: () => void;
  onSaved: (result: {
    webhook: { id: string; name: string; url: string };
    secret?: string;
  }) => void;
}) {
  const t = useTranslations("settings.webhooks");
  const tc = useTranslations("common");
  const [name, setName] = useState(webhook?.name ?? "");
  const [url, setUrl] = useState(webhook?.url ?? "");
  const [events, setEvents] = useState<Set<EventKey>>(
    new Set((webhook?.events ?? ["payment.received"]) as EventKey[]),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const eventsArr = [...events];
      if (eventsArr.length === 0) {
        setError(t("errNoEvent"));
        return;
      }
      const path =
        mode === "create"
          ? `/api/sites/${siteId}/webhooks`
          : `/api/sites/${siteId}/webhooks/${webhook!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          events: eventsArr,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || tc("error"));
        return;
      }
      onSaved({
        webhook: body.webhook ?? { id: webhook?.id ?? "", name, url },
        secret: body.secret,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function toggleEvent(ev: EventKey) {
    setEvents((prev) => {
      const next = new Set(prev);
      if (next.has(ev)) next.delete(ev);
      else next.add(ev);
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-mdf-bg-overlay backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={onSubmit}
        className="mt-4 sm:mt-24 mx-3 sm:mx-0 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-[14px] border border-mdf-line-2 bg-mdf-bg-raised p-5 space-y-4"
        style={{ boxShadow: "var(--mdf-shadow-modal)" }}
      >
        <h2
          className="text-mdf-fg-1"
          style={{
            fontFamily: "var(--mdf-font-display)",
            fontSize: "20px",
            lineHeight: 1.1,
          }}
        >
          {mode === "create" ? t("createTitle") : t("editTitle")}
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="wh-name">{t("fieldName")}</Label>
          <Input
            id="wh-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("fieldNamePlaceholder")}
            required
            maxLength={80}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wh-url">{t("fieldUrl")}</Label>
          <Input
            id="wh-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://hooks.example.com/..."
            required
            type="url"
          />
          <p className="text-[11px] text-mdf-fg-3">{t("fieldUrlHint")}</p>
        </div>

        <div className="space-y-1.5">
          <Label>{t("fieldEvents")}</Label>
          <div className="space-y-2">
            {ALL_EVENTS.map((ev) => (
              <label
                key={ev}
                className="flex items-start gap-2 rounded-md border border-mdf-line-2 px-3 py-2 cursor-pointer hover:border-mdf-line-3"
              >
                <input
                  type="checkbox"
                  checked={events.has(ev)}
                  onChange={() => toggleEvent(ev)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t(`events.${ev}.title`)}</div>
                  <div className="text-[11px] text-mdf-fg-3">
                    {t(`events.${ev}.description`)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error ? (
          <p className="text-sm text-mdf-danger">{error}</p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? tc("saving")
              : mode === "create"
                ? t("create")
                : tc("save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SecretRevealDialog({
  name,
  secret,
  onClose,
}: {
  name: string;
  secret: string;
  onClose: () => void;
}) {
  const t = useTranslations("settings.webhooks");
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-mdf-bg-overlay backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="mt-4 sm:mt-24 mx-3 sm:mx-0 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-[14px] border border-mdf-line-2 bg-mdf-bg-raised p-5 space-y-4"
        style={{ boxShadow: "var(--mdf-shadow-modal)" }}
      >
        <h2
          className="text-mdf-fg-1"
          style={{
            fontFamily: "var(--mdf-font-display)",
            fontSize: "20px",
            lineHeight: 1.1,
          }}
        >
          {t("secretTitle")}
        </h2>
        <p className="text-sm text-mdf-fg-2">
          {t("secretBody", { name })}
        </p>
        <div className="rounded-md bg-mdf-bg-input border border-mdf-line-1 p-3 text-xs font-mono break-all select-all">
          {secret}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={copy}>
            {copied ? t("secretCopied") : t("secretCopy")}
          </Button>
          <Button onClick={onClose}>{t("secretDone")}</Button>
        </div>
      </div>
    </div>
  );
}

type DeliveryRow = {
  id: string;
  event: string;
  status: string;
  statusCode: number | null;
  durationMs: number | null;
  error: string | null;
  attemptedAt: string;
  responseBody: string | null;
};

function DeliveriesDialog({
  siteId,
  webhook,
  onClose,
}: {
  siteId: string;
  webhook: WebhookRow;
  onClose: () => void;
}) {
  const t = useTranslations("settings.webhooks");
  const tc = useTranslations("common");
  const [deliveries, setDeliveries] = useState<DeliveryRow[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sites/${siteId}/webhooks/${webhook.id}/deliveries`)
      .then((r) => r.json())
      .then((b) => {
        if (!cancelled) setDeliveries(b.deliveries ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [siteId, webhook.id]);

  return (
    <div
      className="fixed inset-0 z-[65] flex items-start justify-center bg-mdf-bg-overlay backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="mt-4 sm:mt-12 mx-3 sm:mx-0 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-2xl rounded-[14px] border border-mdf-line-2 bg-mdf-bg-raised p-5 space-y-3"
        style={{ boxShadow: "var(--mdf-shadow-modal)" }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-mdf-fg-1"
            style={{
              fontFamily: "var(--mdf-font-display)",
              fontSize: "20px",
              lineHeight: 1.1,
            }}
          >
            {t("deliveriesTitle", { name: webhook.name })}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {tc("close")}
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {deliveries === null ? (
            <div className="text-sm text-mdf-fg-3 p-4">{tc("loading")}</div>
          ) : deliveries.length === 0 ? (
            <div className="text-sm text-mdf-fg-3 p-4">{t("deliveriesEmpty")}</div>
          ) : (
            <ul className="divide-y divide-mdf-line-1">
              {deliveries.map((d) => (
                <li key={d.id} className="py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(expanded === d.id ? null : d.id)
                    }
                    className="w-full text-left flex flex-wrap items-center gap-2 text-xs"
                  >
                    <span
                      className={`mdf-badge ${
                        d.status === "success"
                          ? "mdf-badge--success"
                          : "mdf-badge--danger"
                      } text-[10px]`}
                    >
                      {d.statusCode ?? "—"}
                    </span>
                    <span
                      className="font-mono text-[11px] text-mdf-fg-2"
                      style={{ fontFamily: "var(--mdf-font-mono)" }}
                    >
                      {d.event}
                    </span>
                    <span className="text-mdf-fg-3 text-[11px] ml-auto">
                      {new Date(d.attemptedAt).toLocaleString()}
                    </span>
                    <span className="text-mdf-fg-3 text-[11px]">
                      {d.durationMs !== null ? `${d.durationMs}ms` : ""}
                    </span>
                  </button>
                  {expanded === d.id ? (
                    <pre className="mt-2 text-[10px] bg-mdf-bg-input border border-mdf-line-1 rounded-md p-2 overflow-auto font-mono max-h-48">
                      {d.error ? `Error: ${d.error}\n\n` : ""}
                      {d.responseBody ?? ""}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const sec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  return `${d}d`;
}
