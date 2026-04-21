"use client";

import { Check, Copy, Share2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Share = {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string | null;
  lastAccessedAt: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  viewId: string;
};

export function ShareDialog({ open, onClose, viewId }: Props) {
  const t = useTranslations("dialogs.share");
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/views/${viewId}/shares`);
      if (!res.ok) throw new Error(t("errLoadStatus", { status: res.status }));
      const body = (await res.json()) as { shares: Share[] };
      setShares(body.shares ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errLoad"));
    } finally {
      setLoading(false);
    }
  }, [viewId, t]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  if (!open) return null;

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/views/${viewId}/shares`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(body.error || t("errFailed", { status: res.status }));
        return;
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errCreate"));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(shareId: string) {
    if (!window.confirm(t("confirmRevoke"))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/views/${viewId}/shares/${shareId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error || t("errFailed", { status: res.status }));
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl(token: string) {
    const url = `${origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-mdf-bg-overlay backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="mt-4 sm:mt-24 mx-3 sm:mx-0 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-[14px] border border-mdf-line-2 bg-mdf-bg-raised text-mdf-fg-1 p-5"
        style={{ boxShadow: "var(--mdf-shadow-modal)" }}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2
              className="text-mdf-fg-1"
              style={{
                fontFamily: "var(--mdf-font-display)",
                fontSize: "20px",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-mdf-fg-3">{t("lead")}</p>
          </div>
          <Share2 size={18} strokeWidth={1.5} className="text-mdf-fg-3" />
        </div>

        {error ? (
          <div
            className="mb-3 rounded-md px-3 py-2 text-xs text-mdf-danger border border-mdf-line-1"
            style={{
              background:
                "color-mix(in srgb, var(--mdf-danger) 10%, transparent)",
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs text-mdf-fg-3">
            {loading
              ? t("loading")
              : t(shares.length === 1 ? "activeLink" : "activeLinkPlural", {
                  count: shares.length,
                })}
          </div>
          <Button size="sm" onClick={create} disabled={busy}>
            {busy ? t("creating") : t("create")}
          </Button>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {shares.map((s) => {
            const url = `${origin}/share/${s.token}`;
            return (
              <div
                key={s.id}
                className="rounded-md border border-mdf-line-1 p-2"
              >
                <div className="flex items-center gap-1">
                  <input
                    readOnly
                    value={url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 bg-transparent text-xs text-mdf-fg-2 font-mono truncate focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyUrl(s.token)}
                    className="mdf-widget__close"
                    aria-label={t("copyLink")}
                  >
                    {copied === s.token ? (
                      <Check
                        size={14}
                        strokeWidth={1.5}
                        className="text-mdf-success"
                      />
                    ) : (
                      <Copy size={14} strokeWidth={1.5} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => revoke(s.id)}
                    className="mdf-widget__close"
                    aria-label={t("revokeLink")}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="mt-1 text-[10px] text-mdf-fg-4">
                  {t("createdOn", {
                    date: new Date(s.createdAt).toLocaleDateString(),
                  })}
                  {" · "}
                  {s.lastAccessedAt
                    ? t("lastOpened", {
                        date: new Date(s.lastAccessedAt).toLocaleDateString(),
                      })
                    : t("neverOpened")}
                </div>
              </div>
            );
          })}
          {shares.length === 0 && !loading ? (
            <div className="rounded-md border border-dashed border-mdf-line-2 p-4 text-center text-xs text-mdf-fg-3">
              {t("emptyState")}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
