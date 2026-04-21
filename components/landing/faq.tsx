"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export function Faq() {
  const t = useTranslations("landing.faq");
  const [open, setOpen] = useState(0);
  const ids = [1, 2, 3, 4, 5, 6] as const;

  return (
    <section className="lp-section" id="faq">
      <div className="lp-container">
        <div className="lp-faq">
          <div>
            <span className="lp-section__label">{t("label")}</span>
            <h2 className="lp-section__title" style={{ fontSize: 40 }}>
              {t("title")}
            </h2>
            <p className="lp-section__lead">
              {t("leadBefore")}
              <a href="mailto:hi@moredatafast.com" style={{ color: "var(--mdf-brand)" }}>
                hi@moredatafast.com
              </a>
              {t("leadAfter")}
            </p>
          </div>
          <div className="lp-faq__list">
            {ids.map((i, idx) => (
              <button
                type="button"
                key={i}
                className="lp-faq__item"
                data-open={open === idx}
                onClick={() => setOpen(open === idx ? -1 : idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: 0,
                  borderBottom: "1px solid var(--mdf-line-1)",
                  font: "inherit",
                  color: "inherit",
                }}
                aria-expanded={open === idx}
              >
                <div className="lp-faq__q">
                  <span>{t(`q${i}` as "q1")}</span>
                  <span className="plus">+</span>
                </div>
                <div className="lp-faq__a">
                  <p>{t(`a${i}` as "a1")}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
