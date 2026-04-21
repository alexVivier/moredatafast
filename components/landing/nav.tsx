import { useTranslations } from "next-intl";

export function Nav() {
  const t = useTranslations("landing.trial");
  const n = useTranslations("landing.nav");
  return (
    <>
      <div className="lp-trial">
        <span>
          {t("before")} <strong style={{ color: "var(--mdf-fg-1)" }}>{t("strong")}</strong>
          {t("after")}
        </span>
        <a href="#pricing">{t("cta")}</a>
      </div>
      <nav className="lp-nav">
        <a href="#" className="lp-nav__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.svg" alt="MDF" />
          <span className="wm">More Data Fast</span>
        </a>
        <div className="lp-nav__links">
          <a href="#features" className="lp-nav__link">
            {n("widgets")}
          </a>
          <a href="#compare" className="lp-nav__link">
            {n("vsDatafast")}
          </a>
          <a href="#pricing" className="lp-nav__link">
            {n("pricing")}
          </a>
          <a href="#faq" className="lp-nav__link">
            {n("faq")}
          </a>
          <a href="/changelog" className="lp-nav__link">
            {n("changelog")}
          </a>
        </div>
        <div className="lp-nav__spacer" />
        <div className="lp-nav__actions">
          <a href="/login" className="lp-btn lp-btn--ghost">
            {n("signIn")}
          </a>
          <a href="#demo" className="lp-btn lp-btn--brand">
            {n("seeDemo")}
          </a>
        </div>
      </nav>
    </>
  );
}
