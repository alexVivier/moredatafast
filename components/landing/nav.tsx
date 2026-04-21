export function Nav() {
  return (
    <>
      <div className="lp-trial">
        <span>
          Free trial: <strong style={{ color: "var(--mdf-fg-1)" }}>14 days left</strong> — no
          credit card required.
        </span>
        <a href="#pricing">Upgrade now →</a>
      </div>
      <nav className="lp-nav">
        <a href="#" className="lp-nav__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.svg" alt="MDF" />
          <span className="wm">More Data Fast</span>
        </a>
        <div className="lp-nav__links">
          <a href="#features" className="lp-nav__link">
            Widgets
          </a>
          <a href="#compare" className="lp-nav__link">
            vs DataFast
          </a>
          <a href="#pricing" className="lp-nav__link">
            Pricing
          </a>
          <a href="#faq" className="lp-nav__link">
            FAQ
          </a>
          <a href="/changelog" className="lp-nav__link">
            Changelog
          </a>
        </div>
        <div className="lp-nav__spacer" />
        <div className="lp-nav__actions">
          <a href="/login" className="lp-btn lp-btn--ghost">
            Sign in
          </a>
          <a href="#demo" className="lp-btn lp-btn--brand">
            See live demo →
          </a>
        </div>
      </nav>
    </>
  );
}
