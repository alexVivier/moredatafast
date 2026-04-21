"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export function Pricing() {
  const t = useTranslations("landing.pricing");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const isYearly = cycle === "yearly";
  const amount = isYearly ? "50" : "5";
  const per = isYearly ? t("perYear") : t("perMonth");
  const hint = isYearly ? t("hintYearly") : t("hintMonthly");
  const includes = [1, 2, 3, 4, 5, 6, 7, 8] as const;

  return (
    <section className="lp-section" id="pricing">
      <div className="lp-container">
        <span className="lp-section__label">{t("label")}</span>
        <h2 className="lp-section__title">{t("title")}</h2>
        <p className="lp-section__lead">{t("lead")}</p>
        <div className="lp-pricing">
          <div className="lp-pricing__copy">
            <h3>{t("copyTitle")}</h3>
            <p>{t("copyBody")}</p>
            <ul className="lp-pricing__bullets">
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i}>
                  <span className="chk">✓</span>
                  {t(`bullet${i}` as "bullet1")}
                </li>
              ))}
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
              <div className="lp-pricing__card-label">{t("planLabel")}</div>
              <div className="lp-pricing__toggle">
                <button type="button" data-active={!isYearly} onClick={() => setCycle("monthly")}>
                  {t("monthly")}
                </button>
                <button type="button" data-active={isYearly} onClick={() => setCycle("yearly")}>
                  {t("yearly")} <span className="lp-pricing__save">{t("save")}</span>
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
              <div className="lp-pricing__includes-label">{t("includesLabel")}</div>
              <ul>
                {includes.map((i) => (
                  <li key={i}>
                    <span className="chk">✓</span>
                    {t(`incl${i}` as "incl1")}
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="/signup"
              className="lp-btn lp-btn--brand lp-btn--lg"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {t("cta")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
