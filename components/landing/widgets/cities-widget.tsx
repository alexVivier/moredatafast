"use client";

import { useTranslations } from "next-intl";

import { WidgetShell } from "./widget-shell";

const ROWS: [string, string, number][] = [
  ["🇫🇷", "Marseille", 12],
  ["🇫🇷", "Paris", 9],
  ["🇬🇵", "Pointe-à-Pitre", 7],
  ["🇨🇦", "Montréal", 6],
  ["🇫🇷", "Lyon", 4],
  ["🇧🇪", "Bruxelles", 3],
];

export function CitiesWidget() {
  const t = useTranslations("landing.widgets");
  const max = Math.max(...ROWS.map((r) => r[2]));
  return (
    <WidgetShell title={t("titleCities")}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="lp-kpi-label">{t("titleCities").toUpperCase()}</span>
        <span className="lp-kpi-label" style={{ color: "var(--mdf-fg-2)" }}>
          {t("citiesTopN")}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {ROWS.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 0",
              fontSize: 12,
              borderTop: i === 0 ? 0 : "1px solid var(--mdf-line-1)",
              position: "relative",
            }}
          >
            <span style={{ fontSize: 14 }}>{r[0]}</span>
            <span style={{ flex: 1, color: "var(--mdf-fg-1)", position: "relative", zIndex: 1 }}>
              {r[1]}
            </span>
            <span
              style={{
                fontFamily: "var(--mdf-font-mono)",
                fontVariantNumeric: "tabular-nums",
                color: "var(--mdf-fg-1)",
                fontSize: 11,
                position: "relative",
                zIndex: 1,
              }}
            >
              {r[2]}
            </span>
            <div
              style={{
                position: "absolute",
                left: 24,
                top: 6,
                bottom: 6,
                width: `${(r[2] / max) * 40}%`,
                background: "rgba(76,130,247,0.08)",
                borderRadius: 2,
              }}
              aria-hidden
            />
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
