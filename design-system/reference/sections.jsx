// sections.jsx — landing page section components

const Nav = () => (
  <>
    <div className="lp-trial">
      <span>Free trial: <strong style={{color: "var(--mdf-fg-1)"}}>14 days left</strong> — no credit card required.</span>
      <a href="#pricing">Upgrade now →</a>
    </div>
    <nav className="lp-nav">
      <a href="#" className="lp-nav__brand">
        <img src="../design-system/logo-mark.svg" alt="MDF"/>
        <span className="wm">More Data Fast</span>
      </a>
      <div className="lp-nav__links">
        <a href="#features" className="lp-nav__link">Widgets</a>
        <a href="#compare" className="lp-nav__link">vs DataFast</a>
        <a href="#pricing" className="lp-nav__link">Pricing</a>
        <a href="#faq" className="lp-nav__link">FAQ</a>
        <a href="#" className="lp-nav__link">Changelog</a>
      </div>
      <div className="lp-nav__spacer"/>
      <div className="lp-nav__actions">
        <a href="#" className="lp-btn lp-btn--ghost">Sign in</a>
        <a href="#demo" className="lp-btn lp-btn--brand">See live demo →</a>
      </div>
    </nav>
  </>
);

const Hero = () => (
  <section className="lp-hero" data-screen-label="Hero">
    <div className="lp-hero__glow"/>
    <div className="lp-grid-bg"/>
    <div className="lp-container lp-hero__inner">
      <div>
        <div className="lp-hero__eyebrow">
          <span className="chip">NEW</span>
          <span>Live payments feed — track MRR the moment it hits</span>
        </div>
        <h1 className="lp-hero__title">
          Your DataFast numbers,<br/>
          <em>recomposed.</em>
        </h1>
        <p className="lp-hero__sub">
          More Data Fast is a dashboard layer on top of DataFast — assemble the widgets you actually read. KPIs, live events, revenue, cohorts. Dense, editorial, exportable. Built by one dev, for operators.
        </p>
        <div className="lp-hero__actions">
          <a href="#demo" className="lp-btn lp-btn--brand lp-btn--lg">See live demo →</a>
          <a href="#pricing" className="lp-btn lp-btn--lg">Start 14-day trial</a>
        </div>
        <div className="lp-hero__meta">
          <span className="lp-hero__meta-item"><span className="dot"/>Works with DataFast out of the box</span>
          <span className="lp-hero__meta-item"><span className="check">✓</span>No credit card required</span>
          <span className="lp-hero__meta-item"><span className="check">✓</span>Cancel anytime</span>
        </div>
      </div>
      <div className="lp-hero__preview">
        <div className="lp-hero__preview-frame">
          <div className="lp-hero__preview-chrome">
            <span className="tl"/><span className="tl"/><span className="tl"/>
            <span className="url">app.moredatafast.com/view/bet-ninja</span>
          </div>
          <div className="lp-hero__preview-body">
            <div style={{gridColumn: "span 6"}}><KpiStrip compact/></div>
            <div style={{gridColumn: "span 4"}}><VisitorsWidget/></div>
            <div style={{gridColumn: "span 2"}}><DevicesDonut/></div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ValueProps = () => (
  <section className="lp-section lp-section--tight" id="demo" data-screen-label="Value props">
    <div className="lp-container">
      <span className="lp-section__label">Why</span>
      <h2 className="lp-section__title">DataFast gives you the data. MDF gives you the <em style={{fontFamily: "var(--mdf-font-display)", color: "var(--mdf-brand)"}}>view</em>.</h2>
      <p className="lp-section__lead">Three things your analytics tab won't do on its own.</p>
      <div className="lp-feat-grid">
        <div className="lp-feat">
          <div className="lp-feat__num">01 / COMPOSE</div>
          <h3 className="lp-feat__title">A dashboard that fits your head.</h3>
          <p className="lp-feat__desc">Drag, drop, resize. Per-widget date ranges. Pin the six numbers you check at 9am; hide the ones you don't. Persistent across sessions, per site.</p>
        </div>
        <div className="lp-feat">
          <div className="lp-feat__num">02 / LIVE</div>
          <h3 className="lp-feat__title">Signals, not screenshots.</h3>
          <p className="lp-feat__desc">Live events feed, live payments feed, crosshair-synced charts. See a checkout land while you're still reading the email that mentioned it.</p>
        </div>
        <div className="lp-feat">
          <div className="lp-feat__num">03 / DENSE</div>
          <h3 className="lp-feat__title">Operator-grade density.</h3>
          <p className="lp-feat__desc">Tabular nums, 1px hairlines, JetBrains Mono on anything numeric. No marketing fluff between you and the number. Share read-only URLs with your co-founder.</p>
        </div>
      </div>
    </div>
  </section>
);

const WidgetShowcase = () => (
  <section className="lp-section" id="features" data-screen-label="Widget showcase">
    <div className="lp-container">
      <span className="lp-section__label">Widgets</span>
      <h2 className="lp-section__title">A widget library that feels like the CLI.</h2>
      <p className="lp-section__lead">Seven widget families, all wired to DataFast, all live.</p>
      <div className="lp-show-grid">
        <div className="lp-show__col lp-show__col--copy">
          <div className="lp-show__eyebrow">THE GRID</div>
          <h3 className="lp-show__title">Every widget is editable, resizable, and live.</h3>
          <p className="lp-show__desc">No templates. Start empty, add what you need, move it where it makes sense. The chrome stays out of the way.</p>
          <ul className="lp-show__list">
            <li><span className="dot">01</span><span><strong style={{color:"var(--mdf-fg-1)"}}>Overview KPIs</strong> — 6-up numeric strip. Visitors, sessions, revenue, conv., bounce, session duration.</span></li>
            <li><span className="dot">02</span><span><strong style={{color:"var(--mdf-fg-1)"}}>Visitors over time</strong> — area chart with crosshair tooltips, dynamic ranges.</span></li>
            <li><span className="dot">03</span><span><strong style={{color:"var(--mdf-fg-1)"}}>Devices donut</strong> — desktop / mobile / tablet breakdown.</span></li>
            <li><span className="dot">04</span><span><strong style={{color:"var(--mdf-fg-1)"}}>Cities top-10</strong> — geo-aware, flags inline.</span></li>
            <li><span className="dot">05</span><span><strong style={{color:"var(--mdf-fg-1)"}}>Live events</strong> — every pageview, signup, custom event — as it happens.</span></li>
            <li><span className="dot">06</span><span><strong style={{color:"var(--mdf-fg-1)"}}>Live payments</strong> — Stripe-connected; MRR the second it posts.</span></li>
            <li><span className="dot">07</span><span><strong style={{color:"var(--mdf-fg-1)"}}>Top campaigns</strong> — UTM-aware, revenue-ranked, attribution-honest.</span></li>
          </ul>
        </div>
        <div className="lp-show__col lp-show__col--widgets">
          <VisitorsWidget/>
          <DevicesDonut/>
          <LiveEventsWidget/>
          <LivePaymentsWidget/>
          <CitiesWidget/>
          <TopCampaignsWidget/>
        </div>
      </div>
    </div>
  </section>
);

const Compare = () => {
  const rows = [
    { label: "Live payments feed (Stripe)", df: "no", mdf: "yes" },
    { label: "Drag-and-drop widget grid", df: "no", mdf: "yes" },
    { label: "Per-widget date ranges", df: "no", mdf: "yes" },
    { label: "Multi-site unified view", df: "partial", mdf: "yes" },
    { label: "Per-widget close / pin", df: "no", mdf: "yes" },
    { label: "Shareable read-only views", df: "no", mdf: "yes" },
    { label: "Organizations / team access", df: "partial", mdf: "yes" },
    { label: "Self-hostable", df: "no", mdf: "yes" },
    { label: "Event ingestion & tag", df: "yes", mdf: "reuses" },
    { label: "Session replay", df: "no", mdf: "no" },
  ];
  const glyph = (s) => {
    if (s === "yes") return <><span className="yes">●</span><span>Yes</span></>;
    if (s === "no") return <><span className="no">—</span><span style={{color:"var(--mdf-fg-3)"}}>No</span></>;
    if (s === "partial") return <><span className="partial">◐</span><span>Partial</span></>;
    if (s === "reuses") return <><span className="yes">↻</span><span>Reuses DataFast</span></>;
  };
  return (
    <section className="lp-section" id="compare" data-screen-label="Compare">
      <div className="lp-container">
        <span className="lp-section__label">vs DataFast alone</span>
        <h2 className="lp-section__title">What you get on top of the analytics you already have.</h2>
        <p className="lp-section__lead">MDF sits beside DataFast, not instead of it. Events still ingest into DataFast; we add the dashboarding layer.</p>
        <div className="lp-compare">
          <div className="lp-compare__row lp-compare__row--head">
            <div className="lp-compare__cell">CAPABILITY</div>
            <div className="lp-compare__cell">DATAFAST ALONE</div>
            <div className="lp-compare__cell lp-compare__cell--mdf">MORE DATA FAST</div>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="lp-compare__row">
              <div className="lp-compare__cell">{r.label}</div>
              <div className="lp-compare__cell">{glyph(r.df)}</div>
              <div className="lp-compare__cell lp-compare__cell--mdf">{glyph(r.mdf)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const [cycle, setCycle] = React.useState("monthly");
  const isYearly = cycle === "yearly";
  const amount = isYearly ? "50" : "5";
  const per = isYearly ? "/ year" : "/ month";
  const hint = isYearly
    ? "billed yearly · 2 months free · vat excluded · cancel anytime"
    : "billed monthly · vat excluded · cancel anytime";
  return (
    <section className="lp-section" id="pricing" data-screen-label="Pricing">
      <div className="lp-container">
        <span className="lp-section__label">Pricing</span>
        <h2 className="lp-section__title">One price. All widgets. All sites.</h2>
        <p className="lp-section__lead">Priced like a tool, not a platform. Cancel anytime.</p>
        <div className="lp-pricing">
          <div className="lp-pricing__copy">
            <h3>Stop budgeting for seats you don't need.</h3>
            <p>A flat price that covers every widget, every site, every team member. We built this for ourselves — the pricing reflects that.</p>
            <ul className="lp-pricing__bullets">
              <li><span className="chk">✓</span>Unlimited sites, unlimited dashboards</li>
              <li><span className="chk">✓</span>Unlimited organization members</li>
              <li><span className="chk">✓</span>14-day free trial, no card needed</li>
              <li><span className="chk">✓</span>Cancel in one click from Settings</li>
              <li><span className="chk">✓</span>Built by a solo dev who answers support himself</li>
            </ul>
          </div>
          <div className="lp-pricing__card">
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16}}>
              <div className="lp-pricing__card-label" style={{margin: 0}}>PRO</div>
              <div className="lp-pricing__toggle">
                <button data-active={!isYearly} onClick={() => setCycle("monthly")}>Monthly</button>
                <button data-active={isYearly} onClick={() => setCycle("yearly")}>
                  Yearly <span className="lp-pricing__save">−17%</span>
                </button>
              </div>
            </div>
            <div className="lp-pricing__price">
              <span className="cur">€</span>
              <span className="amount tabnum">{amount}</span>
              <span className="per">{per}</span>
            </div>
            <p className="lp-pricing__hint">{hint}</p>
            <div className="lp-pricing__includes">
              <div className="lp-pricing__includes-label">Everything included</div>
              <ul>
                <li><span className="chk">✓</span>All widget types</li>
                <li><span className="chk">✓</span>Live events & payments</li>
                <li><span className="chk">✓</span>Shareable views</li>
                <li><span className="chk">✓</span>Organizations</li>
                <li><span className="chk">✓</span>DataFast sync</li>
                <li><span className="chk">✓</span>AES-256-GCM at rest</li>
                <li><span className="chk">✓</span>API access</li>
                <li><span className="chk">✓</span>Dark & light mode</li>
              </ul>
            </div>
            <a href="#" className="lp-btn lp-btn--brand lp-btn--lg" style={{width: "100%", justifyContent: "center"}}>Start 14-day trial →</a>
          </div>
        </div>
      </div>
    </section>
  );
};

const Faq = () => {
  const [open, setOpen] = React.useState(0);
  const qa = [
    ["Do I need a DataFast account first?", "Yes. MDF reads from your existing DataFast workspace — it doesn't replace ingestion. Connect your API key in Settings and we'll pull the last 30 days automatically."],
    ["Is there a free plan?", "No free plan, but a full 14-day trial with every feature unlocked and no credit card required. If you hit day 14 and it's not for you, the dashboards just read-only until you upgrade."],
    ["Can I self-host MDF?", "Yes. MDF ships as a single Docker image with Postgres and a mounted data volume. Encryption keys live in data/master.key; you back those up, we don't hold them."],
    ["What happens if I cancel?", "You keep read-only access until the end of your billing period, then your dashboards freeze. We don't delete anything — re-subscribe and everything comes back exactly as it was."],
    ["Who runs this?", "One developer. That's the whole team. Support emails get answered within 24h on weekdays; the product moves fast because there's no roadmap committee."],
    ["Will MDF get slower as my site scales?", "Queries are cached and incrementally refreshed. We run the same dashboard on a site doing 2M events/month in ~800ms P95. If you're bigger than that, talk to us."],
  ];
  return (
    <section className="lp-section" id="faq" data-screen-label="FAQ">
      <div className="lp-container">
        <div className="lp-faq">
          <div>
            <span className="lp-section__label">FAQ</span>
            <h2 className="lp-section__title" style={{fontSize: 40}}>Questions we actually get.</h2>
            <p className="lp-section__lead">Don't see yours? Email <a href="mailto:hi@moredatafast.com" style={{color: "var(--mdf-brand)"}}>hi@moredatafast.com</a> — I read every one.</p>
          </div>
          <div className="lp-faq__list">
            {qa.map(([q, a], i) => (
              <div key={i} className="lp-faq__item" data-open={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                <div className="lp-faq__q">
                  <span>{q}</span>
                  <span className="plus">+</span>
                </div>
                <div className="lp-faq__a"><p>{a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const FinalCta = () => (
  <section className="lp-cta" data-screen-label="Final CTA">
    <div className="lp-cta__glow"/>
    <div className="lp-grid-bg"/>
    <div className="lp-container lp-cta__inner">
      <h2 className="lp-cta__title">See your numbers, <em>recomposed.</em></h2>
      <p className="lp-cta__sub">Plug in your DataFast workspace. Build a dashboard you actually check. Unsubscribe if we're not it.</p>
      <div className="lp-cta__actions">
        <a href="#" className="lp-btn lp-btn--brand lp-btn--lg">Start 14-day trial →</a>
        <a href="#demo" className="lp-btn lp-btn--lg">See live demo</a>
      </div>
      <div className="lp-cta__hint">from € 5 / mo · € 50 / year · cancel anytime · no card required</div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="lp-footer">
    <div className="lp-container lp-footer__inner">
      <div style={{display: "flex", alignItems: "center", gap: 10}}>
        <img src="../design-system/logo-mark.svg" alt="MDF" style={{height: 16}}/>
        <span>© 2026 More Data Fast · Built solo in Marseille</span>
      </div>
      <div className="lp-footer__links">
        <a href="#">Terms</a>
        <a href="#">Privacy</a>
        <a href="#">Status</a>
        <a href="#">Changelog</a>
        <a href="mailto:hi@moredatafast.com">Contact</a>
      </div>
    </div>
  </footer>
);

Object.assign(window, { Nav, Hero, ValueProps, WidgetShowcase, Compare, Pricing, Faq, FinalCta, Footer });
