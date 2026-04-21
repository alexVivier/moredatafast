"use client";

import { useTranslations } from "next-intl";
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
  vsLabel,
  active,
  isLast = false,
}: {
  label: string;
  target: number;
  format?: (v: number) => string;
  delta: string;
  trend: "up" | "down" | "flat";
  vsLabel: string;
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
        <span className={trend}>{delta}</span> {vsLabel}
      </div>
    </div>
  );
}

export function KpiStrip({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("landing.widgets");
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref);
  return (
    <div ref={ref}>
      <WidgetShell title={t("titleKpi")} hideClose>
        <div style={{ display: "flex", margin: "-12px -14px" }}>
          <KpiCell
            label={t("kpiVisitors")}
            target={165}
            delta={t("kpiDeltaNew")}
            trend="up"
            vsLabel={t("kpiVsPrev")}
            active={active}
          />
          <KpiCell
            label={t("kpiSessions")}
            target={198}
            delta={t("kpiDeltaUp12")}
            trend="up"
            vsLabel={t("kpiVsPrev")}
            active={active}
          />
          <KpiCell
            label={t("kpiRevenue")}
            target={9.99}
            format={(v) => "€ " + v.toFixed(2)}
            delta={t("kpiDeltaFlat")}
            trend="flat"
            vsLabel={t("kpiVsPrev")}
            active={active}
          />
          {compact ? null : (
            <KpiCell
              label={t("kpiConversion")}
              target={0.6}
              format={(v) => v.toFixed(1) + "%"}
              delta={t("kpiDeltaFlat")}
              trend="flat"
              vsLabel={t("kpiVsPrev")}
              active={active}
            />
          )}
          {compact ? null : (
            <KpiCell
              label={t("kpiBounce")}
              target={51.5}
              format={(v) => v.toFixed(1) + "%"}
              delta={t("kpiDeltaNew")}
              trend="up"
              vsLabel={t("kpiVsPrev")}
              active={active}
            />
          )}
          <div style={{ padding: "14px 16px", flex: 1, minWidth: 0 }}>
            <div className="lp-kpi-label">{t("kpiDuration")}</div>
            <div className="lp-kpi-value" style={{ fontVariantNumeric: "tabular-nums" }}>
              18m 1s
            </div>
            <div className="lp-kpi-delta">
              <span className="up">{t("kpiDeltaNew")}</span> {t("kpiVsPrev")}
            </div>
          </div>
        </div>
      </WidgetShell>
    </div>
  );
}
