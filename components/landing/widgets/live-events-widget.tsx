"use client";

import { useEffect, useRef, useState } from "react";

import { useInView } from "@/lib/hooks/use-in-view";

import { WidgetShell } from "./widget-shell";

type Badge = "info" | "success" | "warn" | "brand";
type Event = {
  id: number;
  flag: string;
  badge: Badge;
  event: string;
  path: string;
  ago: string;
};

const POOL: [string, Badge, string, string][] = [
  ["🇫🇷", "info", "PAGEVIEW", "/predictions"],
  ["🇫🇷", "success", "SIGNUP", "/auth/signup"],
  ["🇬🇵", "info", "PAGEVIEW", "/pricing"],
  ["🇨🇦", "success", "CHECKOUT", "/checkout"],
  ["🇫🇷", "brand", "CUSTOM", "upgrade_clicked"],
  ["🇧🇪", "info", "PAGEVIEW", "/predictions"],
  ["🇫🇷", "info", "PAGEVIEW", "/features"],
  ["🇪🇸", "warn", "BOUNCE", "/pricing"],
];

const BADGE_CLASS: Record<Badge, string> = {
  info: "mdf-badge--info",
  success: "mdf-badge--success",
  warn: "mdf-badge--warn",
  brand: "mdf-badge--brand",
};

function makeEvent(i: number): Event {
  const [flag, badge, event, path] = POOL[i % POOL.length];
  return { id: Date.now() + i, flag, badge, event, path, ago: "just now" };
}

function withTimestamps(list: Event[]): Event[] {
  return list.map((e, i) => ({
    ...e,
    ago: i === 0 ? "just now" : `${i * 2 + 1}m ago`,
  }));
}

export function LiveEventsWidget() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false });
  const counter = useRef(5);
  const [events, setEvents] = useState<Event[]>(() =>
    withTimestamps([makeEvent(0), makeEvent(1), makeEvent(2), makeEvent(3), makeEvent(4)]),
  );

  useEffect(() => {
    if (!inView) return;
    const interval = window.setInterval(() => {
      counter.current += 1;
      setEvents((prev) => withTimestamps([makeEvent(counter.current), ...prev.slice(0, 4)]));
    }, 3200);
    return () => window.clearInterval(interval);
  }, [inView]);

  return (
    <div ref={ref}>
      <WidgetShell title="Live events feed">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span
            className="lp-kpi-label"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: "var(--mdf-success)",
                boxShadow: "0 0 0 3px rgba(51,192,138,0.2)",
                animation: "lpPulse 2s ease-in-out infinite",
                display: "inline-block",
              }}
            />
            LIVE EVENTS
          </span>
          <span className="lp-kpi-label" style={{ color: "var(--mdf-fg-2)" }}>
            last 10 min
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {events.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 0",
                fontSize: 12,
                borderTop: i === 0 ? 0 : "1px solid var(--mdf-line-1)",
                animation: i === 0 ? "lpSlideIn 400ms var(--mdf-ease-out)" : "none",
                opacity: 1 - i * 0.1,
              }}
            >
              <span style={{ fontSize: 13 }}>{e.flag}</span>
              <span className={`mdf-badge ${BADGE_CLASS[e.badge]}`} style={{ fontSize: 9 }}>
                {e.event}
              </span>
              <span
                style={{
                  flex: 1,
                  fontFamily: "var(--mdf-font-mono)",
                  fontSize: 11,
                  color: "var(--mdf-fg-2)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {e.path}
              </span>
              <span style={{ fontSize: 10, color: "var(--mdf-fg-3)" }}>{e.ago}</span>
            </div>
          ))}
        </div>
      </WidgetShell>
    </div>
  );
}
