import { useTranslations } from "next-intl";

import { CitiesWidget } from "./widgets/cities-widget";
import { DevicesDonut } from "./widgets/devices-donut";
import { LiveEventsWidget } from "./widgets/live-events-widget";
import { LivePaymentsWidget } from "./widgets/live-payments-widget";
import { TopCampaignsWidget } from "./widgets/top-campaigns-widget";
import { VisitorsWidget } from "./widgets/visitors-widget";

export function WidgetShowcase() {
  const t = useTranslations("landing.showcase");
  const items = [1, 2, 3, 4, 5, 6, 7] as const;
  return (
    <section className="lp-section" id="features">
      <div className="lp-container">
        <span className="lp-section__label">{t("label")}</span>
        <h2 className="lp-section__title">{t("title")}</h2>
        <p className="lp-section__lead">{t("lead")}</p>
        <div className="lp-show-grid">
          <div className="lp-show__col lp-show__col--copy">
            <div className="lp-show__eyebrow">{t("eyebrow")}</div>
            <h3 className="lp-show__title">{t("copyTitle")}</h3>
            <p className="lp-show__desc">{t("copyBody")}</p>
            <ul className="lp-show__list">
              {items.map((i) => (
                <li key={i}>
                  <span className="dot">0{i}</span>
                  <span>
                    <strong style={{ color: "var(--mdf-fg-1)" }}>
                      {t(`item${i}Name` as "item1Name")}
                    </strong>{" "}
                    — {t(`item${i}Desc` as "item1Desc")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lp-show__col lp-show__col--widgets">
            <VisitorsWidget />
            <DevicesDonut />
            <LiveEventsWidget />
            <LivePaymentsWidget />
            <CitiesWidget />
            <TopCampaignsWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
