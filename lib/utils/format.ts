const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
  CHF: "CHF",
};

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("en-US");
}

export function formatCurrency(n: number, currency: string = "USD"): string {
  if (!Number.isFinite(n)) return "—";
  // When mixing sites with different currencies in the unified view we cannot
  // meaningfully add up raw amounts — so surface that to the reader.
  if (currency === "MIXED") return "— (mixed currencies)";
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + " ";
  if (Math.abs(n) >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `${symbol}${(n / 1_000).toFixed(1)}k`;
  return `${symbol}${n.toLocaleString("en-US", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercent(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatPercentAsIs(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

/** DataFast returns avg_session_duration in milliseconds. */
export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (minutes < 60) return remSec === 0 ? `${minutes}m` : `${minutes}m ${remSec}s`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return remMin === 0 ? `${hours}h` : `${hours}h ${remMin}m`;
}

/** Signed delta formatter: "+12.3%", "-4.1%", "0.0%". */
export function formatDeltaPercent(
  current: number,
  previous: number,
  digits = 1
): { label: string; direction: "up" | "down" | "flat" } {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return { label: "—", direction: "flat" };
  }
  if (previous === 0) {
    if (current === 0) return { label: "0%", direction: "flat" };
    return { label: "new", direction: "up" };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(pct * 10) / 10;
  if (rounded === 0) return { label: "0%", direction: "flat" };
  const sign = rounded > 0 ? "+" : "";
  return {
    label: `${sign}${rounded.toFixed(digits)}%`,
    direction: rounded > 0 ? "up" : "down",
  };
}
