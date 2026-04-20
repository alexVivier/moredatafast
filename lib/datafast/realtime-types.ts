export type RealtimeBrowser = { name?: string; version?: string };
export type RealtimeOS = { name?: string; version?: string };
export type RealtimeDevice = { type?: string; vendor?: string; model?: string };

export type RealtimeVisitor = {
  visitorId: string;
  location: {
    city?: string | null;
    region?: string | null;
    countryCode?: string | null;
  };
  system: {
    browser?: RealtimeBrowser;
    os?: RealtimeOS;
    device?: RealtimeDevice;
  };
  currentUrl?: string | null;
  referrer?: string | null;
  sessionStartTime?: string;
  visitCount?: number;
  params?: Record<string, string | null>;
  latitude: number;
  longitude: number;
  isCustomer?: boolean;
  customerName?: string | null;
  customerEmail?: string | null;
  profileData?: {
    displayName?: string | null;
    userId?: string | null;
    hasProfile?: boolean;
    isRandomName?: boolean;
  };
  conversionLikelihood?: {
    score: number;
    confidence: number;
    isBaseline?: boolean;
    dimensionMatches?: string[];
    raw?: {
      conversionRate: number;
      averageValue: number;
      expectedValue: number;
    };
  };
};

export type RealtimeEvent = {
  _id: string;
  type: string; // "pageview" | other
  visitorId: string;
  timestamp: string;
  path?: string | null;
  countryCode?: string | null;
  extraData?: Record<string, unknown>;
  referrer?: string | null;
  customerName?: string | null;
  amount?: number | null;
  displayName?: string | null;
};

export type RealtimePayment = {
  _id: string;
  type: "payment_received" | string;
  timestamp: string;
  name?: string | null;
  email?: string | null;
  amount: number;
  currency: string;
  renewal?: boolean;
  displayName?: string | null;
  isNew?: boolean;
  visible?: boolean;
};

export type RealtimeMapData = {
  count: number;
  visitors: RealtimeVisitor[];
  conversionMetrics?: {
    baselineConversionRate?: number;
    baselineAverageValue?: number;
  };
  hasConversionPredictions?: boolean;
  recentEvents: RealtimeEvent[];
  recentPayments: RealtimePayment[];
};
