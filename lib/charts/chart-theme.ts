/**
 * MDF chart theme — single source of truth for Recharts styling.
 *
 * Resolve tokens on the client from CSS custom properties so light-mode
 * swaps stay automatic. Server-rendered fallbacks use the dark palette.
 */

const DARK_FALLBACK = {
  line1: "rgba(255,255,255,0.06)",
  line2: "rgba(255,255,255,0.10)",
  fg2: "#9097A3",
  fg3: "#5C6270",
  fg4: "#3A3F4B",
  bgRaised: "#141822",
  cat1: "#4C82F7",
  cat2: "#33C08A",
  cat3: "#F59B3C",
  cat4: "#C061F4",
  cat5: "#E5484D",
  cat6: "#E6C84C",
  seq1: "#1A2B4D",
  seq2: "#2E5AA8",
  seq3: "#4C82F7",
  seq4: "#9DB8F2",
  success: "#33C08A",
  danger: "#E5484D",
  warning: "#E6C84C",
  info: "#4C82F7",
};

function read(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return v || fallback;
}

/**
 * Resolve the active MDF chart palette. Call from a useEffect when you
 * need concrete values — during SSR this returns the dark fallback.
 */
export function resolveChartTokens() {
  return {
    line1: read("--mdf-line-1", DARK_FALLBACK.line1),
    line2: read("--mdf-line-2", DARK_FALLBACK.line2),
    fg2: read("--mdf-fg-2", DARK_FALLBACK.fg2),
    fg3: read("--mdf-fg-3", DARK_FALLBACK.fg3),
    fg4: read("--mdf-fg-4", DARK_FALLBACK.fg4),
    bgRaised: read("--mdf-bg-raised", DARK_FALLBACK.bgRaised),
    cat1: read("--mdf-cat-1", DARK_FALLBACK.cat1),
    cat2: read("--mdf-cat-2", DARK_FALLBACK.cat2),
    cat3: read("--mdf-cat-3", DARK_FALLBACK.cat3),
    cat4: read("--mdf-cat-4", DARK_FALLBACK.cat4),
    cat5: read("--mdf-cat-5", DARK_FALLBACK.cat5),
    cat6: read("--mdf-cat-6", DARK_FALLBACK.cat6),
    seq1: read("--mdf-seq-1", DARK_FALLBACK.seq1),
    seq2: read("--mdf-seq-2", DARK_FALLBACK.seq2),
    seq3: read("--mdf-seq-3", DARK_FALLBACK.seq3),
    seq4: read("--mdf-seq-4", DARK_FALLBACK.seq4),
    success: read("--mdf-success", DARK_FALLBACK.success),
    danger: read("--mdf-danger", DARK_FALLBACK.danger),
    warning: read("--mdf-warning", DARK_FALLBACK.warning),
    info: read("--mdf-info", DARK_FALLBACK.info),
  };
}

/** Categorical palette in usage priority. */
export const MDF_CATEGORICAL: readonly string[] = [
  "var(--mdf-cat-1)",
  "var(--mdf-cat-2)",
  "var(--mdf-cat-3)",
  "var(--mdf-cat-4)",
  "var(--mdf-cat-5)",
  "var(--mdf-cat-6)",
];

/** Sequential ramp for area fills, choropleths. */
export const MDF_SEQUENTIAL: readonly string[] = [
  "var(--mdf-seq-1)",
  "var(--mdf-seq-2)",
  "var(--mdf-seq-3)",
  "var(--mdf-seq-4)",
];

/** Standard Recharts axis tick props. */
export const MDF_AXIS_TICK = {
  fontSize: 10,
  fill: "var(--mdf-fg-4)",
  fontFamily: "var(--mdf-font-mono)",
} as const;

/** Standard Recharts tooltip style. */
export const MDF_TOOLTIP_STYLE = {
  background: "var(--mdf-bg-raised)",
  border: "1px solid var(--mdf-line-2)",
  borderRadius: 6,
  fontSize: 12,
  boxShadow: "var(--mdf-shadow-popover)",
} as const;

export const MDF_TOOLTIP_LABEL_STYLE = {
  color: "var(--mdf-fg-3)",
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  fontWeight: 500,
};

/** Standard Recharts grid stroke. */
export const MDF_GRID_STROKE = "var(--mdf-line-1)";
export const MDF_CURSOR_STROKE = "var(--mdf-line-2)";
