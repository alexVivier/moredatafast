import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { decrypt } from "@/lib/crypto/keyring";
import { fetchDataFast, DataFastError } from "@/lib/datafast/client";
import {
  aggregateOverview,
  aggregateRealtimeCount,
  aggregateTimeseries,
  mergeRealtimeMap,
  mergeVisitorsRevenueTable,
  resolveCurrency,
  type PerSite,
} from "@/lib/datafast/aggregate";
import { OrgAuthError, requireOrgMember } from "@/lib/auth/session";

function revalidateFor(path: string): number | false {
  if (path === "analytics/realtime" || path === "analytics/realtime/map") {
    return false;
  }
  if (path === "analytics/metadata") return 3600;
  return 60;
}

// Mapping: endpoint → natural key used to dedupe rows during cross-site merge.
const TABLE_ENDPOINT_KEYS: Record<string, (row: Record<string, unknown>) => string> = {
  "analytics/pages": (r) => `${String(r.hostname ?? "")}|${String(r.path ?? "")}`,
  "analytics/referrers": (r) => String(r.referrer ?? ""),
  "analytics/hostnames": (r) => String(r.hostname ?? ""),
  "analytics/countries": (r) => String(r.country ?? ""),
  "analytics/regions": (r) => String(r.region ?? ""),
  "analytics/cities": (r) => String(r.city ?? ""),
  "analytics/devices": (r) => String(r.device ?? ""),
  "analytics/browsers": (r) => String(r.browser ?? ""),
  "analytics/operating-systems": (r) => String(r.operating_system ?? ""),
};

function isVisitorsRevenueTable(path: string): boolean {
  return path in TABLE_ENDPOINT_KEYS;
}

function parseIntParam(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  let organizationId: string;
  try {
    ({ organizationId } = await requireOrgMember(request.headers));
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    throw err;
  }

  const { path } = await context.params;
  const joinedPath = path.join("/");
  const searchParams = new URL(request.url).searchParams;
  const paramsObj: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) paramsObj[k] = v;

  const sites = await db
    .select()
    .from(schema.sites)
    .where(eq(schema.sites.organizationId, organizationId))
    .orderBy(asc(schema.sites.sortOrder));

  if (sites.length === 0) {
    return NextResponse.json({
      status: "success",
      data: [],
      perSite: [],
      currency: "USD",
    });
  }

  // Fan out, preserving errors per site
  const settled = await Promise.allSettled(
    sites.map(async (s) => {
      const apiKey = decrypt(s.apiKeyEncrypted);
      const envelope = await fetchDataFast(apiKey, joinedPath, {
        searchParams: paramsObj,
        revalidate: revalidateFor(joinedPath),
      });
      return {
        siteId: s.id,
        currency: s.currency,
        envelope,
      } satisfies PerSite;
    })
  );

  const perSiteStatus = settled.map((res, i) => {
    if (res.status === "fulfilled") {
      return { siteId: sites[i].id, status: "ok" as const };
    }
    const err = res.reason;
    let message = "Upstream error";
    let code = 502;
    if (err instanceof DataFastError) {
      message = err.message;
      code = err.status;
    } else if (err instanceof Error) {
      message = err.message;
    }
    return {
      siteId: sites[i].id,
      status: "error" as const,
      error: { code, message },
    };
  });

  const fulfilled = settled
    .filter(
      (r): r is PromiseFulfilledResult<PerSite<unknown>> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value);

  // If all sites failed: return an error but keep perSite
  if (fulfilled.length === 0) {
    return NextResponse.json(
      {
        status: "error",
        error: { code: 502, message: "All sites failed to respond" },
        perSite: perSiteStatus,
      },
      { status: 502 }
    );
  }

  // Dispatch
  try {
    if (joinedPath === "analytics/overview") {
      const result = aggregateOverview(
        fulfilled as unknown as PerSite<
          {
            visitors: number;
            sessions: number;
            bounce_rate: number;
            avg_session_duration: number;
            currency: string;
            revenue: number;
            revenue_per_visitor: number;
            conversion_rate: number;
          }[]
        >[]
      );
      return NextResponse.json({
        status: "success",
        data: result.data,
        currency: result.currency,
        perSite: perSiteStatus,
      });
    }

    if (joinedPath === "analytics/timeseries") {
      const result = aggregateTimeseries(
        fulfilled as unknown as PerSite<never[]>[]
      );
      return NextResponse.json({
        ...result,
        perSite: perSiteStatus,
      });
    }

    if (joinedPath === "analytics/realtime") {
      const result = aggregateRealtimeCount(
        fulfilled as unknown as PerSite<{ visitors: number }[]>[]
      );
      return NextResponse.json({
        status: "success",
        data: result.data,
        perSite: perSiteStatus,
      });
    }

    if (joinedPath === "analytics/realtime/map") {
      const result = mergeRealtimeMap(
        fulfilled as unknown as PerSite<{
          count: number;
          visitors: Array<Record<string, unknown>>;
          recentEvents: Array<Record<string, unknown>>;
          recentPayments: Array<Record<string, unknown>>;
          hasConversionPredictions?: boolean;
        }>[]
      );
      return NextResponse.json({
        status: "success",
        data: result.data,
        perSite: perSiteStatus,
      });
    }

    if (joinedPath === "analytics/metadata") {
      const currency = resolveCurrency(fulfilled);
      return NextResponse.json({
        status: "success",
        data: [
          {
            domain: "unified",
            timezone: "UTC",
            name: "Unified",
            logo: null,
            kpiColorScheme: "blue",
            kpi: null,
            currency: currency === "MIXED" ? "USD" : currency,
          },
        ],
        currency,
        perSite: perSiteStatus,
      });
    }

    if (joinedPath === "analytics/goals") {
      const limit = parseIntParam(searchParams.get("limit"), 10);
      const result = mergeGoalsTable(
        fulfilled as unknown as PerSite<
          { goal: string; completions: number; visitors: number }[]
        >[],
        limit
      );
      return NextResponse.json({
        status: "success",
        data: result.data,
        pagination: result.pagination,
        perSite: perSiteStatus,
      });
    }

    if (joinedPath === "analytics/campaigns") {
      const limit = parseIntParam(searchParams.get("limit"), 10);
      const result = mergeCampaignsTable(
        fulfilled as unknown as PerSite<CampaignRow[]>[],
        limit
      );
      return NextResponse.json({
        status: "success",
        data: result.data,
        pagination: result.pagination,
        currency: result.currency,
        perSite: perSiteStatus,
      });
    }

    if (isVisitorsRevenueTable(joinedPath)) {
      const limit = parseIntParam(searchParams.get("limit"), 100);
      const keyOf = TABLE_ENDPOINT_KEYS[joinedPath];
      const result = mergeVisitorsRevenueTable(
        fulfilled as unknown as PerSite<
          Record<string, unknown> &
            { visitors?: number; revenue?: number }[]
        >[],
        keyOf as (row: Record<string, unknown>) => string,
        limit
      );
      return NextResponse.json({
        status: "success",
        data: result.data,
        pagination: result.pagination,
        currency: result.currency,
        perSite: perSiteStatus,
      });
    }

    return NextResponse.json(
      {
        status: "error",
        error: {
          code: 400,
          message: `Endpoint /${joinedPath} is not aggregatable in unified view.`,
        },
        perSite: perSiteStatus,
      },
      { status: 400 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: 500,
          message: e instanceof Error ? e.message : "Aggregation failed",
        },
        perSite: perSiteStatus,
      },
      { status: 500 }
    );
  }
}

// -- goals & campaigns need custom aggregators (different row shapes) ---------

type GoalRow = { goal: string; completions: number; visitors: number };

function mergeGoalsTable(
  sites: PerSite<GoalRow[]>[],
  limit: number
): {
  data: GoalRow[];
  pagination: { limit: number; offset: number; total: number };
} {
  const byKey = new Map<string, GoalRow>();
  for (const s of sites) {
    const rows = s.envelope.data ?? [];
    for (const r of rows) {
      const existing = byKey.get(r.goal);
      if (!existing) {
        byKey.set(r.goal, { ...r });
      } else {
        byKey.set(r.goal, {
          ...existing,
          completions: (existing.completions ?? 0) + (r.completions ?? 0),
          visitors: (existing.visitors ?? 0) + (r.visitors ?? 0),
        });
      }
    }
  }
  const merged = [...byKey.values()].sort((a, b) => b.completions - a.completions);
  return {
    data: merged.slice(0, limit),
    pagination: { limit, offset: 0, total: merged.length },
  };
}

function keyForCampaign(c: Record<string, unknown>): string {
  return [
    c.utm_source,
    c.utm_medium,
    c.utm_campaign,
    c.utm_term,
    c.utm_content,
    c.ref,
    c.source,
    c.via,
  ]
    .map((v) => (typeof v === "string" ? v : ""))
    .join("|");
}

type CampaignRow = {
  campaign: Record<string, unknown>;
  visitors: number;
  revenue: number;
};

function mergeCampaignsTable(
  sites: PerSite<CampaignRow[]>[],
  limit: number
): {
  data: CampaignRow[];
  pagination: { limit: number; offset: number; total: number };
  currency: string;
} {
  const currency = resolveCurrency(sites);
  const hideRevenue = currency === "MIXED";
  const byKey = new Map<string, CampaignRow>();
  for (const s of sites) {
    const rows = s.envelope.data ?? [];
    for (const r of rows) {
      const k = keyForCampaign(r.campaign ?? {});
      const existing = byKey.get(k);
      const revenueDelta = hideRevenue ? 0 : r.revenue ?? 0;
      if (!existing) {
        byKey.set(k, {
          ...r,
          revenue: revenueDelta,
        });
      } else {
        byKey.set(k, {
          campaign: existing.campaign,
          visitors: (existing.visitors ?? 0) + (r.visitors ?? 0),
          revenue: (existing.revenue ?? 0) + revenueDelta,
        });
      }
    }
  }
  const merged = [...byKey.values()].sort((a, b) => b.visitors - a.visitors);
  return {
    data: merged.slice(0, limit),
    pagination: { limit, offset: 0, total: merged.length },
    currency,
  };
}
