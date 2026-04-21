import { useTranslations } from "next-intl";

export function FinalCta() {
  const t = useTranslations("landing.finalCta");
  return (
    <section className="lp-cta">
      <div className="lp-cta__glow" />
      <div className="lp-grid-bg" />
      <div className="lp-container lp-cta__inner">
        <h2 className="lp-cta__title">
          {t("title1")}
          <em>{t("titleEm")}</em>
        </h2>
        <p className="lp-cta__sub">{t("sub")}</p>
        <div className="lp-cta__actions">
          <a href="/signup" className="lp-btn lp-btn--brand lp-btn--lg">
            {t("ctaPrimary")}
          </a>
          <a href="#demo" className="lp-btn lp-btn--lg">
            {t("ctaSecondary")}
          </a>
        </div>
        <div className="lp-cta__hint">{t("hint")}</div>
      </div>
    </section>
  );
}
