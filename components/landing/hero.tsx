import { useTranslations } from "next-intl";

import { KpiStrip } from "./widgets/kpi-strip";
import { VisitorsWidget } from "./widgets/visitors-widget";
import { DevicesDonut } from "./widgets/devices-donut";

export function Hero() {
  const t = useTranslations("landing.hero");
  return (
    <section className="lp-hero">
      <div className="lp-hero__glow" />
      <div className="lp-grid-bg" />
      <div className="lp-container lp-hero__inner">
        <div>
          <div className="lp-hero__eyebrow">
            <span className="chip">{t("eyebrowChip")}</span>
            <span>{t("eyebrowText")}</span>
          </div>
          <h1 className="lp-hero__title">
            {t("title1")}
            <br />
            <em>{t("titleEm")}</em>
          </h1>
          <p className="lp-hero__sub">{t("sub")}</p>
          <div className="lp-hero__actions">
            <a href="#demo" className="lp-btn lp-btn--brand lp-btn--lg">
              {t("ctaPrimary")}
            </a>
            <a href="#pricing" className="lp-btn lp-btn--lg">
              {t("ctaSecondary")}
            </a>
          </div>
          <div className="lp-hero__meta">
            <span className="lp-hero__meta-item">
              <span className="dot" />
              {t("meta1")}
            </span>
            <span className="lp-hero__meta-item">
              <span className="check">✓</span>
              {t("meta2")}
            </span>
            <span className="lp-hero__meta-item">
              <span className="check">✓</span>
              {t("meta3")}
            </span>
          </div>
        </div>
        <div className="lp-hero__preview">
          <div className="lp-hero__preview-frame">
            <div className="lp-hero__preview-chrome">
              <span className="tl" />
              <span className="tl" />
              <span className="tl" />
              <span className="url">app.moredatafast.com/view/bet-ninja</span>
            </div>
            <div className="lp-hero__preview-body">
              <div style={{ gridColumn: "span 6" }}>
                <KpiStrip compact />
              </div>
              <div style={{ gridColumn: "span 4" }}>
                <VisitorsWidget />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <DevicesDonut />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
