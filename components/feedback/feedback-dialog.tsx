"use client";

import { useEffect, useState } from "react";
import { Bug, Check, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";

type FeedbackType = "bug" | "suggestion";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function FeedbackDialog({ open, onClose }: Props) {
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) {
      setType("suggestion");
      setMessage("");
      setSubmitting(false);
      setError(null);
      setSent(false);
    }
  }, [open]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || `Request failed (${res.status})`);
        return;
      }
      setSent(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
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
        className="mt-4 sm:mt-24 mx-3 sm:mx-0 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-[14px] border border-mdf-line-2 bg-mdf-bg-raised text-mdf-fg-1 p-5"
        style={{ boxShadow: "var(--mdf-shadow-modal)" }}
      >
        {sent ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-mdf-line-1 text-mdf-success">
              <Check size={20} strokeWidth={1.5} />
            </div>
            <h2
              className="mt-3 text-mdf-fg-1"
              style={{
                fontFamily: "var(--mdf-font-display)",
                fontSize: "20px",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              Thanks
            </h2>
            <p className="mt-1 text-sm text-mdf-fg-3">
              Your {type === "bug" ? "bug report" : "suggestion"} was sent.
            </p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-4">
              <h2
                className="text-mdf-fg-1"
                style={{
                  fontFamily: "var(--mdf-font-display)",
                  fontSize: "20px",
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                }}
              >
                Send feedback
              </h2>
              <p className="mt-1 text-sm text-mdf-fg-3">
                Bug, missing feature, anything broken — we read every message.
              </p>
            </div>

            <div className="mb-3 flex rounded-md border border-mdf-line-2 p-0.5">
              <SegmentedButton
                active={type === "suggestion"}
                onClick={() => setType("suggestion")}
                icon={<Lightbulb size={14} strokeWidth={1.5} />}
                label="Suggestion"
              />
              <SegmentedButton
                active={type === "bug"}
                onClick={() => setType("bug")}
                icon={<Bug size={14} strokeWidth={1.5} />}
                label="Bug"
              />
            </div>

            <div className="mb-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === "bug"
                    ? "What did you expect? What happened instead? Steps to reproduce help a lot."
                    : "What would make DataFast better for you?"
                }
                rows={6}
                maxLength={2000}
                autoFocus
                required
                className="w-full resize-none rounded-md border border-mdf-line-2 bg-mdf-bg-input text-mdf-fg-1 px-3 py-2 text-sm focus:outline-none focus:border-mdf-line-3"
              />
              <div className="mt-1 text-right font-mono text-[10px] text-mdf-fg-3 tabular-nums">
                {message.length}/2000
              </div>
            </div>

            {error ? (
              <div
                className="mb-3 rounded-md px-3 py-2 text-xs text-mdf-danger border border-mdf-line-1"
                style={{
                  background: "color-mix(in srgb, var(--mdf-danger) 10%, transparent)",
                }}
              >
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || message.trim().length < 5}
              >
                {submitting ? "Sending…" : "Send feedback"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SegmentedButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-xs font-medium transition " +
        (active
          ? "bg-mdf-fg-1 text-mdf-fg-inverse"
          : "text-mdf-fg-2 hover:bg-mdf-line-1 hover:text-mdf-fg-1")
      }
    >
      {icon}
      {label}
    </button>
  );
}
