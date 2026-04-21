"use client";

import { useEffect, useRef, useState } from "react";

import { useInView } from "@/lib/hooks/use-in-view";

import { WidgetShell } from "./widget-shell";

const SEGMENTS = [
  { label: "desktop", value: 60, color: "var(--lp-accent, #4C82F7)" },
  { label: "mobile", value: 30, color: "#33C08A" },
  { label: "tablet", value: 10, color: "var(--mdf-brand)" },
];

export function DevicesDonut() {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1000);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const sum = 100;
  const r = 38;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div ref={ref}>
      <WidgetShell title="Devices">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            paddingTop: 6,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div className="lp-kpi-label">VISITORS</div>
            <div style={{ fontSize: 11, color: "var(--mdf-fg-2)", marginTop: 2 }}>165 visitors</div>
          </div>
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
            {SEGMENTS.map((s, i) => {
              const len = (s.value / sum) * c * progress;
              const dash = `${len} ${c - len}`;
              const offset = -acc;
              acc += len;
              return (
                <circle
                  key={i}
                  cx="48"
                  cy="48"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="9"
                  strokeDasharray={dash}
                  strokeDashoffset={offset}
                  transform="rotate(-90 48 48)"
                />
              );
            })}
          </svg>
          <div
            style={{
              display: "flex",
              gap: 12,
              fontSize: 10,
              color: "var(--mdf-fg-2)",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {SEGMENTS.map((s) => (
              <span
                key={s.label}
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: s.color,
                    display: "inline-block",
                  }}
                />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </WidgetShell>
    </div>
  );
}
