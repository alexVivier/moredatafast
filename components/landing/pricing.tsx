"use client";

import { useState } from "react";

const INCLUDES = [
  "All widget types",
  "Live events & payments",
  "Shareable views",
  "Organizations",
  "DataFast sync",
  "AES-256-GCM at rest",
  "API access",
  "Dark & light mode",
];

export function Pricing() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const isYearly = cycle === "yearly";
  const amount = isYearly ? "50" : "5";
  const per = isYearly ? "/ year" : "/ month";
  const hint = isYearly
    ? "billed yearly · 2 months free · vat excluded · cancel anytime"
    : "billed monthly · vat excluded · cancel anytime";

  return (
    <section className="lp-section" id="pricing">
      <div className="lp-container">
        <span className="lp-section__label">Pricing</span>
        <h2 className="lp-section__title">One price. All widgets. All sites.</h2>
        <p className="lp-section__lead">
          Priced like a tool, not a platform. Cancel anytime.
        </p>
        <div className="lp-pricing">
          <div className="lp-pricing__copy">
            <h3>Stop budgeting for seats you don&apos;t need.</h3>
            <p>
              A flat price that covers every widget, every site, every team member. We built
              this for ourselves — the pricing reflects that.
            </p>
            <ul className="lp-pricing__bullets">
              <li>
                <span className="chk">✓</span>Unlimited sites, unlimited dashboards
              </li>
              <li>
                <span className="chk">✓</span>Unlimited organization members
              </li>
              <li>
                <span className="chk">✓</span>14-day free trial, no card needed
              </li>
              <li>
                <span className="chk">✓</span>Cancel in one click from Settings
              </li>
              <li>
                <span className="chk">✓</span>Built by a solo dev who answers support himself
              </li>
            </ul>
          </div>
          <div className="lp-pricing__card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div className="lp-pricing__card-label">PRO</div>
              <div className="lp-pricing__toggle">
                <button type="button" data-active={!isYearly} onClick={() => setCycle("monthly")}>
                  Monthly
                </button>
                <button type="button" data-active={isYearly} onClick={() => setCycle("yearly")}>
                  Yearly <span className="lp-pricing__save">−17%</span>
                </button>
              </div>
            </div>
            <div className="lp-pricing__price">
              <span className="cur">€</span>
              <span className="amount">{amount}</span>
              <span className="per">{per}</span>
            </div>
            <p className="lp-pricing__hint">{hint}</p>
            <div className="lp-pricing__includes">
              <div className="lp-pricing__includes-label">Everything included</div>
              <ul>
                {INCLUDES.map((item) => (
                  <li key={item}>
                    <span className="chk">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="/signup"
              className="lp-btn lp-btn--brand lp-btn--lg"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Start 14-day trial →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
