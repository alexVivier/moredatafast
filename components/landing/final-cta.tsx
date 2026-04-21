export function FinalCta() {
  return (
    <section className="lp-cta">
      <div className="lp-cta__glow" />
      <div className="lp-grid-bg" />
      <div className="lp-container lp-cta__inner">
        <h2 className="lp-cta__title">
          See your numbers, <em>recomposed.</em>
        </h2>
        <p className="lp-cta__sub">
          Plug in your DataFast workspace. Build a dashboard you actually check. Unsubscribe if
          we&apos;re not it.
        </p>
        <div className="lp-cta__actions">
          <a href="/signup" className="lp-btn lp-btn--brand lp-btn--lg">
            Start 14-day trial →
          </a>
          <a href="#demo" className="lp-btn lp-btn--lg">
            See live demo
          </a>
        </div>
        <div className="lp-cta__hint">
          from € 5 / mo · € 50 / year · cancel anytime · no card required
        </div>
      </div>
    </section>
  );
}
