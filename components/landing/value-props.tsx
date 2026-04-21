export function ValueProps() {
  return (
    <section className="lp-section lp-section--tight" id="demo">
      <div className="lp-container">
        <span className="lp-section__label">Why</span>
        <h2 className="lp-section__title">
          DataFast gives you the data. MDF gives you the <em>view</em>.
        </h2>
        <p className="lp-section__lead">
          Three things your analytics tab won&apos;t do on its own.
        </p>
        <div className="lp-feat-grid">
          <div className="lp-feat">
            <div className="lp-feat__num">01 / COMPOSE</div>
            <h3 className="lp-feat__title">A dashboard that fits your head.</h3>
            <p className="lp-feat__desc">
              Drag, drop, resize. Per-widget date ranges. Pin the six numbers you check at 9am;
              hide the ones you don&apos;t. Persistent across sessions, per site.
            </p>
          </div>
          <div className="lp-feat">
            <div className="lp-feat__num">02 / LIVE</div>
            <h3 className="lp-feat__title">Signals, not screenshots.</h3>
            <p className="lp-feat__desc">
              Live events feed, live payments feed, crosshair-synced charts. See a checkout land
              while you&apos;re still reading the email that mentioned it.
            </p>
          </div>
          <div className="lp-feat">
            <div className="lp-feat__num">03 / DENSE</div>
            <h3 className="lp-feat__title">Operator-grade density.</h3>
            <p className="lp-feat__desc">
              Tabular nums, 1px hairlines, JetBrains Mono on anything numeric. No marketing fluff
              between you and the number. Share read-only URLs with your co-founder.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
