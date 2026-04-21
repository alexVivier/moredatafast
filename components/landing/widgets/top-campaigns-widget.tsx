"use client";

import { useTranslations } from "next-intl";

import { WidgetShell } from "./widget-shell";

const ROWS = [
  { id: "t20243697790430546", kind: "fb", rev: "€ 290", v: 19 },
  { id: "t20243697790430547", kind: "fb", rev: "€ 145", v: 18 },
  { id: "t20243697790430548", kind: "ig", rev: "€ 58", v: 12 },
  { id: "t20243697790430549", kind: "ig", rev: "—", v: 7 },
];

export function TopCampaignsWidget() {
  const t = useTranslations("landing.widgets");
  return (
    <WidgetShell title={t("titleCampaigns")}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="lp-kpi-label">{t("titleCampaigns").toUpperCase()}</span>
        <span className="lp-kpi-label" style={{ color: "var(--mdf-fg-2)" }}>
          {t("campaignsTopN")}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 60px 40px",
            gap: 10,
            fontSize: 9,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--mdf-fg-3)",
            padding: "4px 0",
          }}
        >
          <span>{t("campaignCol")}</span>
          <span style={{ textAlign: "right" }}>{t("revenueCol")}</span>
          <span style={{ textAlign: "right" }}>{t("visitsCol")}</span>
        </div>
        {ROWS.map((r, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 60px 40px",
              gap: 10,
              alignItems: "center",
              padding: "6px 0",
              borderTop: "1px solid var(--mdf-line-1)",
              fontSize: 11,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <span
                style={{
                  background: "rgba(76,130,247,0.14)",
                  color: "#8BB0F9",
                  padding: "1px 5px",
                  borderRadius: 2,
                  fontFamily: "var(--mdf-font-mono)",
                  fontSize: 10,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 120,
                }}
              >
                {r.id}
              </span>
              <span style={{ color: "var(--mdf-fg-3)", fontSize: 10 }}>({r.kind})</span>
            </span>
            <span
              style={{
                fontFamily: "var(--mdf-font-mono)",
                textAlign: "right",
                color: r.rev === "—" ? "var(--mdf-fg-4)" : "var(--mdf-fg-1)",
              }}
            >
              {r.rev}
            </span>
            <span
              style={{
                fontFamily: "var(--mdf-font-mono)",
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {r.v}
            </span>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
