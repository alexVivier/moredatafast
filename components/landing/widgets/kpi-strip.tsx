"use client";

import { useRef } from "react";

import { useCountUp } from "@/lib/hooks/use-count-up";
import { useInView } from "@/lib/hooks/use-in-view";

import { WidgetShell } from "./widget-shell";

function KpiCell({
  label,
  target,
  format,
  delta,
  trend,
  active,
  isLast = false,
}: {
  label: string;
  target: number;
  format?: (v: number) => string;
  delta: string;
  trend: "up" | "down" | "flat";
  active: boolean;
  isLast?: boolean;
}) {
  const v = useCountUp(target, { duration: 1400, active });
  const formatted = format ? format(v) : Math.round(v).toString();
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRight: isLast ? "none" : "1px solid var(--mdf-line-1)",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div className="lp-kpi-label">{label}</div>
      <div className="lp-kpi-value" style={{ fontVariantNumeric: "tabular-nums" }}>
        {formatted}
      </div>
      <div className="lp-kpi-delta">
        <span className={trend}>{delta}</span> vs previous 7d
      </div>
    </div>
  );
}

export function KpiStrip({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref);
  return (
    <div ref={ref}>
      <WidgetShell title="Overview KPIs" hideClose>
        <div style={{ display: "flex", margin: "-12px -14px" }}>
          <KpiCell label="VISITORS" target={165} delta="↑ new" trend="up" active={active} />
          <KpiCell label="SESSIONS" target={198} delta="↑ 12%" trend="up" active={active} />
          <KpiCell
            label="REVENUE"
            target={9.99}
            format={(v) => "€ " + v.toFixed(2)}
            delta="-0%"
            trend="flat"
            active={active}
          />
          {compact ? null : (
            <KpiCell
              label="CONV. RATE"
              target={0.6}
              format={(v) => v.toFixed(1) + "%"}
              delta="-0%"
              trend="flat"
              active={active}
            />
          )}
          {compact ? null : (
            <KpiCell
              label="BOUNCE"
              target={51.5}
              format={(v) => v.toFixed(1) + "%"}
              delta="↑ new"
              trend="up"
              active={active}
            />
          )}
          <div style={{ padding: "14px 16px", flex: 1, minWidth: 0 }}>
            <div className="lp-kpi-label">AVG DURATION</div>
            <div className="lp-kpi-value" style={{ fontVariantNumeric: "tabular-nums" }}>
              18m 1s
            </div>
            <div className="lp-kpi-delta">
              <span className="up">↑ new</span> vs previous 7d
            </div>
          </div>
        </div>
      </WidgetShell>
    </div>
  );
}
