"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils/format";

export type TopMetricTableProps<Row> = {
  title: string;
  subtitle?: ReactNode;
  rows: Row[] | undefined;
  loading: boolean;
  error: string | null;
  limit: number;
  rowKey: (row: Row, index: number) => string;
  renderLabel: (row: Row) => ReactNode;
  /** Label of the left column. E.g. "Referrer", "Page", "Country". */
  itemLabel: string;
  /** Primary metric (rightmost column, drives the bar width). */
  primary: (row: Row) => number;
  primaryLabel: string;
  primaryFormat?: "currency" | "number";
  /** Optional secondary metric (middle column). */
  secondary?: (row: Row) => number;
  secondaryLabel?: string;
  secondaryFormat?: "currency" | "number";
  currency?: string;
  emptyHint?: string;
};

function formatMetric(
  value: number,
  format: "currency" | "number",
  currency: string
): string {
  if (!Number.isFinite(value)) return "—";
  if (format === "currency") {
    if (value <= 0) return "—";
    return formatCurrency(value, currency);
  }
  return formatNumber(value);
}

export function TopMetricTable<Row>({
  title,
  subtitle,
  rows,
  loading,
  error,
  limit,
  rowKey,
  renderLabel,
  itemLabel,
  primary,
  primaryLabel,
  primaryFormat = "number",
  secondary,
  secondaryLabel,
  secondaryFormat = "currency",
  currency = "USD",
  emptyHint,
}: TopMetricTableProps<Row>) {
  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  const safeRows = rows ?? [];
  const maxPrimary = Math.max(1, ...safeRows.map(primary));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between pb-2 gap-2">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </div>
          {subtitle ? (
            <div className="text-xs text-muted-foreground truncate">
              {subtitle}
            </div>
          ) : null}
        </div>
        <div className="text-xs text-muted-foreground shrink-0">
          top {limit}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="space-y-1.5">
            {Array.from({ length: Math.min(5, limit) }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-full animate-pulse rounded bg-muted/40"
              />
            ))}
          </div>
        ) : safeRows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {emptyHint ?? "No data in this range"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-medium py-1.5">{itemLabel}</th>
                {secondary && secondaryLabel ? (
                  <th className="text-right font-medium py-1.5 w-24">
                    {secondaryLabel}
                  </th>
                ) : null}
                <th
                  className={cn(
                    "text-right font-medium py-1.5",
                    secondary ? "w-24" : "w-32"
                  )}
                >
                  {primaryLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {safeRows.map((row, i) => {
                const primaryValue = primary(row);
                const bar = (primaryValue / maxPrimary) * 100;
                return (
                  <tr
                    key={rowKey(row, i)}
                    className="border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="py-1.5 relative pr-2">
                      <div
                        className="absolute inset-y-0.5 left-0 rounded-sm bg-blue-500/15 dark:bg-blue-400/20"
                        style={{ width: `${bar}%` }}
                        aria-hidden
                      />
                      <span className="relative block truncate text-xs">
                        {renderLabel(row)}
                      </span>
                    </td>
                    {secondary && secondaryLabel ? (
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                        {formatMetric(secondary(row), secondaryFormat, currency)}
                      </td>
                    ) : null}
                    <td className="py-1.5 text-right tabular-nums">
                      {formatMetric(primaryValue, primaryFormat, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
