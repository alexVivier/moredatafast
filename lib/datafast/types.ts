export type DataFastEnvelope<T> = {
  status: "success" | "error";
  data?: T;
  error?: { code: number; message: string };
  pagination?: { limit: number; offset: number; total: number };
};

export type MetadataRow = {
  domain: string;
  timezone: string;
  name: string;
  logo: string | null;
  kpiColorScheme: string;
  kpi: string | null;
  currency: string;
};

export type OverviewRow = {
  visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
  currency: string;
  revenue: number;
  revenue_per_visitor: number;
  conversion_rate: number;
};

export type RealtimeCountRow = { visitors: number };

export type TimeseriesPoint = {
  name: string;
  timestamp: string;
  visitors?: number;
  sessions?: number;
  revenue?: number;
  revenueBreakdown?: { new: number; renewal: number; refund: number };
  conversion_rate?: number;
};

export type TimeseriesResponse = {
  status: "success";
  fields: string[];
  interval: "hour" | "day" | "week" | "month";
  timezone: string;
  currency: string | null;
  totals: Record<string, number | { new: number; renewal: number; refund: number }>;
  data: TimeseriesPoint[];
  pagination?: { limit: number; offset: number; total: number };
};
