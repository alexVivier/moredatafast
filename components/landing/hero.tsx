import { KpiStrip } from "./widgets/kpi-strip";
import { VisitorsWidget } from "./widgets/visitors-widget";
import { DevicesDonut } from "./widgets/devices-donut";

export function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero__glow" />
      <div className="lp-grid-bg" />
      <div className="lp-container lp-hero__inner">
        <div>
          <div className="lp-hero__eyebrow">
            <span className="chip">NEW</span>
            <span>Live payments feed — track MRR the moment it hits</span>
          </div>
          <h1 className="lp-hero__title">
            Your DataFast numbers,
            <br />
            <em>recomposed.</em>
          </h1>
          <p className="lp-hero__sub">
            More Data Fast is a dashboard layer on top of DataFast — assemble the widgets you
            actually read. KPIs, live events, revenue, cohorts. Dense, editorial, exportable.
            Built by one dev, for operators.
          </p>
          <div className="lp-hero__actions">
            <a href="#demo" className="lp-btn lp-btn--brand lp-btn--lg">
              See live demo →
            </a>
            <a href="#pricing" className="lp-btn lp-btn--lg">
              Start 14-day trial
            </a>
          </div>
          <div className="lp-hero__meta">
            <span className="lp-hero__meta-item">
              <span className="dot" />
              Works with DataFast out of the box
            </span>
            <span className="lp-hero__meta-item">
              <span className="check">✓</span>No credit card required
            </span>
            <span className="lp-hero__meta-item">
              <span className="check">✓</span>Cancel anytime
            </span>
          </div>
        </div>
        <div className="lp-hero__preview">
          <div className="lp-hero__preview-frame">
            <div className="lp-hero__preview-chrome">
              <span className="tl" />
              <span className="tl" />
              <span className="tl" />
              <span className="url">app.moredatafast.com/view/bet-ninja</span>
            </div>
            <div className="lp-hero__preview-body">
              <div style={{ gridColumn: "span 6" }}>
                <KpiStrip compact />
              </div>
              <div style={{ gridColumn: "span 4" }}>
                <VisitorsWidget />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <DevicesDonut />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
