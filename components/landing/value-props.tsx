import { useTranslations } from "next-intl";

export function ValueProps() {
  const t = useTranslations("landing.value");
  return (
    <section className="lp-section lp-section--tight" id="demo">
      <div className="lp-container">
        <span className="lp-section__label">{t("label")}</span>
        <h2 className="lp-section__title">
          {t("title1")}
          <em>{t("titleEm")}</em>
          {t("titleDot")}
        </h2>
        <p className="lp-section__lead">{t("lead")}</p>
        <div className="lp-feat-grid">
          <div className="lp-feat">
            <div className="lp-feat__num">{t("card1Num")}</div>
            <h3 className="lp-feat__title">{t("card1Title")}</h3>
            <p className="lp-feat__desc">{t("card1Body")}</p>
          </div>
          <div className="lp-feat">
            <div className="lp-feat__num">{t("card2Num")}</div>
            <h3 className="lp-feat__title">{t("card2Title")}</h3>
            <p className="lp-feat__desc">{t("card2Body")}</p>
          </div>
          <div className="lp-feat">
            <div className="lp-feat__num">{t("card3Num")}</div>
            <h3 className="lp-feat__title">{t("card3Title")}</h3>
            <p className="lp-feat__desc">{t("card3Body")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
