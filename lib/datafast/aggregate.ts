import type { DataFastEnvelope } from "./types";

export type PerSite<T = unknown> = {
  siteId: string;
  currency: string;
  envelope: DataFastEnvelope<T>;
};

function weightedAvg(
  values: { value: number; weight: number }[]
): number {
  const totalWeight = values.reduce((s, v) => s + v.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = values.reduce((s, v) => s + v.value * v.weight, 0);
  return weighted / totalWeight;
}

function resolveCurrency(sites: PerSite<unknown>[]): string {
  const all = new Set(sites.map((s) => s.currency));
  if (all.size === 1) return [...all][0];
  return "MIXED";
}

// -----------------------------------------------------------------------------
// Overview
// -----------------------------------------------------------------------------

type OverviewRow = {
  visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
  currency: string;
  revenue: number;
  revenue_per_visitor: number;
  conversion_rate: number;
};

export function aggregateOverview(sites: PerSite<OverviewRow[]>[]): {
  data: OverviewRow[];
  currency: string;
} {
  const rows = sites
    .map((s) => s.envelope.data?.[0])
    .filter((r): r is OverviewRow => !!r);

  if (rows.length === 0) {
    return {
      data: [],
      currency: resolveCurrency(sites),
    };
  }

  const visitors = rows.reduce((s, r) => s + (r.visitors ?? 0), 0);
  const sessions = rows.reduce((s, r) => s + (r.sessions ?? 0), 0);
  const revenue = rows.reduce((s, r) => s + (r.revenue ?? 0), 0);

  const bounce_rate = weightedAvg(
    rows.map((r) => ({ value: r.bounce_rate ?? 0, weight: r.sessions ?? 0 }))
  );
  const conversion_rate = weightedAvg(
    rows.map((r) => ({ value: r.conversion_rate ?? 0, weight: r.visitors ?? 0 }))
  );
  const avg_session_duration = weightedAvg(
    rows.map((r) => ({
      value: r.avg_session_duration ?? 0,
      weight: r.sessions ?? 0,
    }))
  );
  const revenue_per_visitor = visitors > 0 ? revenue / visitors : 0;

  const currency = resolveCurrency(sites);

  return {
    data: [
      {
        visitors,
        sessions,
        bounce_rate,
        avg_session_duration,
        currency: currency === "MIXED" ? "" : currency,
        revenue: currency === "MIXED" ? 0 : revenue,
        revenue_per_visitor: currency === "MIXED" ? 0 : revenue_per_visitor,
        conversion_rate,
      },
    ],
    currency,
  };
}

// -----------------------------------------------------------------------------
// Timeseries
// -----------------------------------------------------------------------------

type TimeseriesPoint = {
  name: string;
  timestamp: string;
  visitors?: number;
  sessions?: number;
  revenue?: number;
  revenueBreakdown?: { new: number; renewal: number; refund: number };
  conversion_rate?: number;
};

type TimeseriesEnvelope = {
  status: string;
  fields?: string[];
  interval?: string;
  timezone?: string;
  currency?: string;
  totals?: Record<string, number | { new: number; renewal: number; refund: number }>;
  data?: TimeseriesPoint[];
};

export function aggregateTimeseries(
  sites: PerSite<TimeseriesPoint[]>[]
): TimeseriesEnvelope & { currency: string } {
  const envelopes = sites.map((s) => s.envelope as unknown as TimeseriesEnvelope);
  const anchor = envelopes.find((e) => e?.data && e.data.length > 0);
  const currency = resolveCurrency(sites);
  const hideRevenue = currency === "MIXED";

  if (!anchor) {
    return {
      status: "success",
      fields: [],
      interval: undefined,
      timezone: undefined,
      currency: currency === "MIXED" ? "" : currency,
      totals: {},
      data: [],
    } as TimeseriesEnvelope & { currency: string };
  }

  // Align on timestamp: expect all sites to have been queried with the same
  // interval + tz + range. Build a map keyed by timestamp then sum.
  const timestamps = anchor.data!.map((p) => p.timestamp);
  const byTs: Map<string, { name: string; totals: Record<string, number> }> =
    new Map(
      anchor.data!.map((p) => [p.timestamp, { name: p.name, totals: {} }])
    );

  // Track visitor weight per timestamp for weighted conv rate avg
  const visitorsPerTs: Map<string, number> = new Map();

  for (const env of envelopes) {
    if (!env?.data) continue;
    for (const p of env.data) {
      const slot = byTs.get(p.timestamp);
      if (!slot) continue;
      for (const field of ["visitors", "sessions", "revenue"] as const) {
        const v = (p as Record<string, unknown>)[field];
        if (typeof v === "number") {
          slot.totals[field] = (slot.totals[field] ?? 0) + v;
        }
      }
      if (typeof p.visitors === "number") {
        visitorsPerTs.set(
          p.timestamp,
          (visitorsPerTs.get(p.timestamp) ?? 0) + p.visitors
        );
      }
      if (p.revenueBreakdown) {
        const prev = (slot.totals as Record<string, number>);
        prev["revenueBreakdown_new"] =
          (prev["revenueBreakdown_new"] ?? 0) + (p.revenueBreakdown.new ?? 0);
        prev["revenueBreakdown_renewal"] =
          (prev["revenueBreakdown_renewal"] ?? 0) +
          (p.revenueBreakdown.renewal ?? 0);
        prev["revenueBreakdown_refund"] =
          (prev["revenueBreakdown_refund"] ?? 0) + (p.revenueBreakdown.refund ?? 0);
      }
    }

    // Weighted conversion rate per timestamp: accumulate numerator (rate * visitors) then divide later
    if (env.data) {
      for (const p of env.data) {
        if (typeof p.conversion_rate === "number" && typeof p.visitors === "number") {
          const slot = byTs.get(p.timestamp);
          if (slot) {
            slot.totals["_cr_num"] =
              (slot.totals["_cr_num"] ?? 0) + p.conversion_rate * p.visitors;
          }
        }
      }
    }
  }

  const data: TimeseriesPoint[] = timestamps.map((ts) => {
    const slot = byTs.get(ts)!;
    const visitors = slot.totals["visitors"];
    const sessions = slot.totals["sessions"];
    const revenue = slot.totals["revenue"];
    const crNum = slot.totals["_cr_num"] ?? 0;
    const vWeight = visitorsPerTs.get(ts) ?? 0;

    const point: TimeseriesPoint = {
      name: slot.name,
      timestamp: ts,
    };
    if (visitors !== undefined) point.visitors = visitors;
    if (sessions !== undefined) point.sessions = sessions;
    if (revenue !== undefined && !hideRevenue) {
      point.revenue = revenue;
      if (
        slot.totals["revenueBreakdown_new"] !== undefined ||
        slot.totals["revenueBreakdown_renewal"] !== undefined ||
        slot.totals["revenueBreakdown_refund"] !== undefined
      ) {
        point.revenueBreakdown = {
          new: slot.totals["revenueBreakdown_new"] ?? 0,
          renewal: slot.totals["revenueBreakdown_renewal"] ?? 0,
          refund: slot.totals["revenueBreakdown_refund"] ?? 0,
        };
      }
    }
    if (vWeight > 0) point.conversion_rate = crNum / vWeight;

    return point;
  });

  // Totals: aggregate the same way on envelope-level totals.
  const totals: Record<
    string,
    number | { new: number; renewal: number; refund: number }
  > = {};
  for (const field of ["visitors", "sessions"] as const) {
    const sum = envelopes.reduce((s, env) => {
      const t = env?.totals?.[field];
      return s + (typeof t === "number" ? t : 0);
    }, 0);
    totals[field] = sum;
  }
  if (!hideRevenue) {
    totals.revenue = envelopes.reduce((s, env) => {
      const t = env?.totals?.revenue;
      return s + (typeof t === "number" ? t : 0);
    }, 0);
    const bd = envelopes
      .map((env) => env?.totals?.revenueBreakdown)
      .filter(
        (b): b is { new: number; renewal: number; refund: number } =>
          typeof b === "object" && b !== null
      );
    if (bd.length > 0) {
      totals.revenueBreakdown = {
        new: bd.reduce((s, b) => s + (b.new ?? 0), 0),
        renewal: bd.reduce((s, b) => s + (b.renewal ?? 0), 0),
        refund: bd.reduce((s, b) => s + (b.refund ?? 0), 0),
      };
    }
  }
  // conv rate weighted avg across all visitors
  const crWeighted = weightedAvg(
    envelopes.map((env) => ({
      value:
        typeof env?.totals?.conversion_rate === "number"
          ? (env.totals.conversion_rate as number)
          : 0,
      weight:
        typeof env?.totals?.visitors === "number"
          ? (env.totals.visitors as number)
          : 0,
    }))
  );
  totals.conversion_rate = crWeighted;

  return {
    status: "success",
    fields: anchor.fields,
    interval: anchor.interval,
    timezone: anchor.timezone,
    currency: currency === "MIXED" ? "" : currency,
    totals,
    data,
  };
}

// -----------------------------------------------------------------------------
// Tables
// -----------------------------------------------------------------------------

type TableRow = Record<string, unknown>;

/**
 * Generic table merge. Caller supplies `keyOf(row)` for the natural key and
 * `primary`/`secondary` accessors for the two numeric columns.
 */
export function mergeTables<Row extends TableRow>(
  sites: PerSite<Row[]>[],
  opts: {
    keyOf: (row: Row) => string;
    primary: (row: Row) => number;
    secondary?: (row: Row) => number;
    merge?: (a: Row, b: Row) => Row;
    sortBy: "primary" | "secondary";
    limit: number;
  }
): { data: Row[]; pagination: { limit: number; offset: number; total: number }; currency: string } {
  const byKey = new Map<string, Row>();
  for (const s of sites) {
    const rows = s.envelope.data ?? [];
    for (const r of rows) {
      const k = opts.keyOf(r);
      const existing = byKey.get(k);
      if (!existing) {
        byKey.set(k, { ...r });
      } else {
        byKey.set(k, opts.merge ? opts.merge(existing, r) : { ...existing, ...r });
      }
    }
  }

  const merged = [...byKey.values()].sort((a, b) => {
    const fn = opts.sortBy === "secondary" && opts.secondary ? opts.secondary : opts.primary;
    return fn(b) - fn(a);
  });

  return {
    data: merged.slice(0, opts.limit),
    pagination: { limit: opts.limit, offset: 0, total: merged.length },
    currency: resolveCurrency(sites),
  };
}

type BasicVisitorsRevenueRow = { visitors?: number; revenue?: number; [k: string]: unknown };

function sumVisitorsRevenue<T extends BasicVisitorsRevenueRow>(a: T, b: T): T {
  return {
    ...a,
    ...b,
    visitors: (a.visitors ?? 0) + (b.visitors ?? 0),
    revenue: (a.revenue ?? 0) + (b.revenue ?? 0),
  } as T;
}

export function mergeVisitorsRevenueTable<Row extends BasicVisitorsRevenueRow>(
  sites: PerSite<Row[]>[],
  keyOf: (row: Row) => string,
  limit: number
) {
  const currency = resolveCurrency(sites);
  const hideRevenue = currency === "MIXED";
  return mergeTables<Row>(sites, {
    keyOf,
    primary: (r) => r.visitors ?? 0,
    secondary: (r) => (hideRevenue ? 0 : r.revenue ?? 0),
    merge: (a, b) => {
      const merged = sumVisitorsRevenue(a, b);
      if (hideRevenue) {
        return { ...merged, revenue: 0 } as Row;
      }
      return merged;
    },
    sortBy: "primary",
    limit,
  });
}

// -----------------------------------------------------------------------------
// Realtime
// -----------------------------------------------------------------------------

type RealtimeCountRow = { visitors: number };

export function aggregateRealtimeCount(
  sites: PerSite<RealtimeCountRow[]>[]
): { data: RealtimeCountRow[] } {
  const total = sites.reduce((s, site) => {
    const v = site.envelope.data?.[0]?.visitors;
    return s + (typeof v === "number" ? v : 0);
  }, 0);
  return { data: [{ visitors: total }] };
}

type RealtimeMapEnvelope = {
  count: number;
  visitors: Array<Record<string, unknown>>;
  recentEvents: Array<Record<string, unknown>>;
  recentPayments: Array<Record<string, unknown>>;
  hasConversionPredictions?: boolean;
};

export function mergeRealtimeMap(sites: PerSite<RealtimeMapEnvelope>[]): {
  data: RealtimeMapEnvelope;
} {
  const visitors: Array<Record<string, unknown>> = [];
  const recentEvents: Array<Record<string, unknown>> = [];
  const recentPayments: Array<Record<string, unknown>> = [];
  let count = 0;
  let hasPredictions = false;

  for (const site of sites) {
    const body = site.envelope.data as RealtimeMapEnvelope | undefined;
    if (!body) continue;
    count += body.count ?? (body.visitors?.length ?? 0);
    hasPredictions = hasPredictions || !!body.hasConversionPredictions;

    for (const v of body.visitors ?? []) {
      visitors.push({ ...v, _siteId: site.siteId });
    }
    for (const e of body.recentEvents ?? []) {
      recentEvents.push({ ...e, _siteId: site.siteId });
    }
    for (const p of body.recentPayments ?? []) {
      recentPayments.push({ ...p, _siteId: site.siteId });
    }
  }

  // Sort event/payment feeds by timestamp desc
  const byTsDesc = (a: Record<string, unknown>, b: Record<string, unknown>) => {
    const at = new Date(String(a.timestamp ?? 0)).getTime();
    const bt = new Date(String(b.timestamp ?? 0)).getTime();
    return bt - at;
  };
  recentEvents.sort(byTsDesc);
  recentPayments.sort(byTsDesc);

  return {
    data: {
      count,
      visitors,
      recentEvents: recentEvents.slice(0, 100),
      recentPayments: recentPayments.slice(0, 50),
      hasConversionPredictions: hasPredictions,
    },
  };
}

// -----------------------------------------------------------------------------
// Dispatcher
// -----------------------------------------------------------------------------

export type AggregateResult = {
  body: unknown; // endpoint-specific body
  status: "success" | "error";
  error?: { code: number; message: string };
};

export { resolveCurrency };
