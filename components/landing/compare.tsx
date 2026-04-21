import { useTranslations } from "next-intl";

type Status = "yes" | "no" | "partial" | "reuses";

const ROWS: { key: string; df: Status; mdf: Status }[] = [
  { key: "row1", df: "no", mdf: "yes" },
  { key: "row2", df: "no", mdf: "yes" },
  { key: "row3", df: "no", mdf: "yes" },
  { key: "row4", df: "partial", mdf: "yes" },
  { key: "row5", df: "no", mdf: "yes" },
  { key: "row6", df: "no", mdf: "yes" },
  { key: "row7", df: "partial", mdf: "yes" },
  { key: "row8", df: "no", mdf: "yes" },
  { key: "row9", df: "yes", mdf: "reuses" },
  { key: "row10", df: "no", mdf: "no" },
];

export function Compare() {
  const t = useTranslations("landing.compare");

  function Glyph({ status }: { status: Status }) {
    switch (status) {
      case "yes":
        return (
          <>
            <span className="yes">●</span>
            <span>{t("yes")}</span>
          </>
        );
      case "no":
        return (
          <>
            <span className="no">—</span>
            <span style={{ color: "var(--mdf-fg-3)" }}>{t("no")}</span>
          </>
        );
      case "partial":
        return (
          <>
            <span className="partial">◐</span>
            <span>{t("partial")}</span>
          </>
        );
      case "reuses":
        return (
          <>
            <span className="yes">↻</span>
            <span>{t("reuses")}</span>
          </>
        );
    }
  }

  return (
    <section className="lp-section" id="compare">
      <div className="lp-container">
        <span className="lp-section__label">{t("label")}</span>
        <h2 className="lp-section__title">{t("title")}</h2>
        <p className="lp-section__lead">{t("lead")}</p>
        <div className="lp-compare">
          <div className="lp-compare__row lp-compare__row--head">
            <div className="lp-compare__cell">{t("headCapability")}</div>
            <div className="lp-compare__cell">{t("headDatafast")}</div>
            <div className="lp-compare__cell lp-compare__cell--mdf">{t("headMdf")}</div>
          </div>
          {ROWS.map((r) => (
            <div key={r.key} className="lp-compare__row">
              <div className="lp-compare__cell">
                {t(r.key as "row1" | "row2")}
              </div>
              <div className="lp-compare__cell">
                <Glyph status={r.df} />
              </div>
              <div className="lp-compare__cell lp-compare__cell--mdf">
                <Glyph status={r.mdf} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
