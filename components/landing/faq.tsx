"use client";

import { useState } from "react";

const QA: [string, string][] = [
  [
    "Do I need a DataFast account first?",
    "Yes. MDF reads from your existing DataFast workspace — it doesn't replace ingestion. Connect your API key in Settings and we'll pull the last 30 days automatically.",
  ],
  [
    "Is there a free plan?",
    "No free plan, but a full 14-day trial with every feature unlocked and no credit card required. If you hit day 14 and it's not for you, the dashboards just read-only until you upgrade.",
  ],
  [
    "Can I self-host MDF?",
    "Yes. MDF ships as a single Docker image with Postgres and a mounted data volume. Encryption keys live in data/master.key; you back those up, we don't hold them.",
  ],
  [
    "What happens if I cancel?",
    "You keep read-only access until the end of your billing period, then your dashboards freeze. We don't delete anything — re-subscribe and everything comes back exactly as it was.",
  ],
  [
    "Who runs this?",
    "One developer. That's the whole team. Support emails get answered within 24h on weekdays; the product moves fast because there's no roadmap committee.",
  ],
  [
    "Will MDF get slower as my site scales?",
    "Queries are cached and incrementally refreshed. We run the same dashboard on a site doing 2M events/month in ~800ms P95. If you're bigger than that, talk to us.",
  ],
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="lp-section" id="faq">
      <div className="lp-container">
        <div className="lp-faq">
          <div>
            <span className="lp-section__label">FAQ</span>
            <h2 className="lp-section__title" style={{ fontSize: 40 }}>
              Questions we actually get.
            </h2>
            <p className="lp-section__lead">
              Don&apos;t see yours? Email{" "}
              <a href="mailto:hi@moredatafast.com" style={{ color: "var(--mdf-brand)" }}>
                hi@moredatafast.com
              </a>{" "}
              — I read every one.
            </p>
          </div>
          <div className="lp-faq__list">
            {QA.map(([q, a], i) => (
              <button
                type="button"
                key={i}
                className="lp-faq__item"
                data-open={open === i}
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: 0,
                  borderBottom: "1px solid var(--mdf-line-1)",
                  font: "inherit",
                  color: "inherit",
                }}
                aria-expanded={open === i}
              >
                <div className="lp-faq__q">
                  <span>{q}</span>
                  <span className="plus">+</span>
                </div>
                <div className="lp-faq__a">
                  <p>{a}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
