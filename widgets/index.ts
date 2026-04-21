// Side-effect imports: every widget calls register() at module top-level, so
// importing them here is enough to populate the registry.
import "./kpi/overview-kpis";
import "./timeseries/visitors-timeseries";
import "./timeseries/revenue-timeseries";
import "./timeseries/multi-metric-timeseries";
import "./heatmaps/traffic-heatmap";
import "./heatmaps/calendar-heatmap";
import "./heatmaps/monthly-cadence-heatmap";
import "./tables/top-pages";
import "./tables/top-referrers";
import "./tables/top-campaigns";
import "./tables/top-goals";
import "./tables/top-hostnames";
import "./geo/countries-table";
import "./geo/regions-table";
import "./geo/cities-table";
import "./device/devices-breakdown";
import "./device/browsers-breakdown";
import "./device/os-breakdown";
import "./realtime/live-counter";
import "./realtime/live-globe";
import "./realtime/country-map";
import "./realtime/live-events-feed";
import "./realtime/live-payments-feed";

export {
  getWidget,
  getAllWidgets,
  getWidgetsByCategory,
  CATEGORY_LABELS,
  type WidgetDefinition,
  type WidgetCategory,
  type WidgetContext,
} from "./registry";
