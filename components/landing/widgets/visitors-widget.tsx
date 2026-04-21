"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useCountUp } from "@/lib/hooks/use-count-up";
import { useInView } from "@/lib/hooks/use-in-view";

import { WidgetShell } from "./widget-shell";

const DATA = [30, 42, 35, 55, 48, 62, 50, 44, 58, 52, 42, 66, 58, 72, 68, 80];
const X_LABELS = ["15 Apr", "17 Apr", "19 Apr", "21 Apr", "23 Apr"];

function AreaChartAnimated({ height = 140 }: { height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1200);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const W = 520;
  const H = height - 20;
  const pad = 4;
  const max = Math.max(...DATA);
  const min = Math.min(...DATA);
  const step = W / (DATA.length - 1);
  const y = (v: number) => pad + (H - pad * 2) * ((max - v) / (max - min || 1));
  const pts = DATA.map((v, i) => `${(i * step).toFixed(2)},${y(v).toFixed(2)}`).join(" L");
  const visibleW = W * progress;

  return (
    <div ref={ref} style={{ width: "100%", flex: 1, minHeight: 100, position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <linearGradient id="lp-vis-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--lp-accent, #4C82F7)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--lp-accent, #4C82F7)" stopOpacity="0" />
          </linearGradient>
          <clipPath id="lp-vis-clip">
            <rect x="0" y="0" width={visibleW} height={height} />
          </clipPath>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            x2={W}
            y1={pad + (H - pad * 2) * f}
            y2={pad + (H - pad * 2) * f}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}
        <g clipPath="url(#lp-vis-clip)">
          <path d={`M0,${H} L${pts} L${W},${H} Z`} fill="url(#lp-vis-grad)" />
          <path d={`M${pts}`} fill="none" stroke="var(--lp-accent, #4C82F7)" strokeWidth="1.5" />
        </g>
        <line
          x1={visibleW}
          x2={visibleW}
          y1="0"
          y2={H}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        {X_LABELS.map((l, i, a) => (
          <text
            key={l}
            x={(W / (a.length - 1)) * i}
            y={height - 2}
            fontFamily="var(--mdf-font-mono)"
            fontSize="9"
            fill="var(--mdf-fg-3)"
          >
            {l}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function VisitorsWidget() {
  const t = useTranslations("landing.widgets");
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref);
  const v = useCountUp(165, { duration: 1600, active });
  return (
    <div ref={ref} style={{ height: "100%" }}>
      <WidgetShell title={t("titleVisitors")}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <span className="lp-kpi-label">{t("visitorsLabel")}</span>
          <span className="lp-kpi-label" style={{ color: "var(--mdf-fg-2)" }}>
            {t("visitorsInterval")}
          </span>
        </div>
        <div
          className="lp-kpi-value"
          style={{ fontSize: 32, margin: "4px 0 8px", fontVariantNumeric: "tabular-nums" }}
        >
          {Math.round(v)}
        </div>
        <AreaChartAnimated />
      </WidgetShell>
    </div>
  );
}
