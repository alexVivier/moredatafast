import { CitiesWidget } from "./widgets/cities-widget";
import { DevicesDonut } from "./widgets/devices-donut";
import { LiveEventsWidget } from "./widgets/live-events-widget";
import { LivePaymentsWidget } from "./widgets/live-payments-widget";
import { TopCampaignsWidget } from "./widgets/top-campaigns-widget";
import { VisitorsWidget } from "./widgets/visitors-widget";

const ITEMS: { n: string; name: string; desc: string }[] = [
  {
    n: "01",
    name: "Overview KPIs",
    desc: "6-up numeric strip. Visitors, sessions, revenue, conv., bounce, session duration.",
  },
  {
    n: "02",
    name: "Visitors over time",
    desc: "area chart with crosshair tooltips, dynamic ranges.",
  },
  { n: "03", name: "Devices donut", desc: "desktop / mobile / tablet breakdown." },
  { n: "04", name: "Cities top-10", desc: "geo-aware, flags inline." },
  {
    n: "05",
    name: "Live events",
    desc: "every pageview, signup, custom event — as it happens.",
  },
  {
    n: "06",
    name: "Live payments",
    desc: "Stripe-connected; MRR the second it posts.",
  },
  {
    n: "07",
    name: "Top campaigns",
    desc: "UTM-aware, revenue-ranked, attribution-honest.",
  },
];

export function WidgetShowcase() {
  return (
    <section className="lp-section" id="features">
      <div className="lp-container">
        <span className="lp-section__label">Widgets</span>
        <h2 className="lp-section__title">A widget library that feels like the CLI.</h2>
        <p className="lp-section__lead">
          Seven widget families, all wired to DataFast, all live.
        </p>
        <div className="lp-show-grid">
          <div className="lp-show__col lp-show__col--copy">
            <div className="lp-show__eyebrow">THE GRID</div>
            <h3 className="lp-show__title">Every widget is editable, resizable, and live.</h3>
            <p className="lp-show__desc">
              No templates. Start empty, add what you need, move it where it makes sense. The
              chrome stays out of the way.
            </p>
            <ul className="lp-show__list">
              {ITEMS.map((item) => (
                <li key={item.n}>
                  <span className="dot">{item.n}</span>
                  <span>
                    <strong style={{ color: "var(--mdf-fg-1)" }}>{item.name}</strong> — {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lp-show__col lp-show__col--widgets">
            <VisitorsWidget />
            <DevicesDonut />
            <LiveEventsWidget />
            <LivePaymentsWidget />
            <CitiesWidget />
            <TopCampaignsWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
