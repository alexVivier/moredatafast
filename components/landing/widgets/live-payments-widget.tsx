"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useInView } from "@/lib/hooks/use-in-view";

import { WidgetShell } from "./widget-shell";

type Payment = { id: number; flag: string; amount: string; plan: string };

const POOL: [string, string, string][] = [
  ["🇫🇷", "€ 5.00", "Pro monthly"],
  ["🇨🇦", "$ 5.00", "Pro monthly"],
  ["🇫🇷", "€ 50.00", "Pro yearly"],
  ["🇧🇪", "€ 5.00", "Pro monthly"],
  ["🇪🇸", "€ 5.00", "Pro monthly"],
];

function makePayment(i: number): Payment {
  const [flag, amount, plan] = POOL[i % POOL.length];
  return { id: Date.now() + i, flag, amount, plan };
}

export function LivePaymentsWidget() {
  const t = useTranslations("landing.widgets");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false });
  const counter = useRef(4);
  const [rows, setRows] = useState<Payment[]>(() => [
    makePayment(0),
    makePayment(1),
    makePayment(2),
    makePayment(3),
  ]);

  useEffect(() => {
    if (!inView) return;
    const interval = window.setInterval(() => {
      counter.current += 1;
      setRows((prev) => [makePayment(counter.current), ...prev.slice(0, 3)]);
    }, 4800);
    return () => window.clearInterval(interval);
  }, [inView]);

  return (
    <div ref={ref}>
      <WidgetShell title={t("titleLivePayments")}>
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
                background: "var(--mdf-brand)",
                boxShadow: "0 0 0 3px rgba(245,155,60,0.2)",
                animation: "lpPulse 2s ease-in-out infinite",
                display: "inline-block",
              }}
            />
            {t("livePayments")}
          </span>
          <span className="lp-kpi-label" style={{ color: "var(--mdf-fg-2)" }}>
            {t("liveLast")}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rows.map((r, i) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 0",
                fontSize: 12,
                borderTop: i === 0 ? 0 : "1px solid var(--mdf-line-1)",
                animation: i === 0 ? "lpSlideIn 400ms var(--mdf-ease-out)" : "none",
              }}
            >
              <span style={{ fontSize: 13 }}>{r.flag}</span>
              <span className="mdf-badge mdf-badge--success" style={{ fontSize: 9 }}>
                PAID
              </span>
              <span style={{ flex: 1, fontSize: 11, color: "var(--mdf-fg-2)" }}>{r.plan}</span>
              <span
                style={{
                  fontFamily: "var(--mdf-font-mono)",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--mdf-fg-1)",
                  fontSize: 12,
                }}
              >
                {r.amount}
              </span>
            </div>
          ))}
        </div>
      </WidgetShell>
    </div>
  );
}
