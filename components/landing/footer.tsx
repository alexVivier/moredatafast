import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/providers/locale-switcher";

export function Footer() {
  const t = useTranslations("landing.footer");
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer__inner">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.svg" alt="MDF" style={{ height: 16 }} />
          <span>{t("copyright")}</span>
        </div>
        <div className="lp-footer__links">
          <a href="/terms">{t("terms")}</a>
          <a href="/privacy">{t("privacy")}</a>
          <a href="/status">{t("status")}</a>
          <a href="/changelog">{t("changelog")}</a>
          <a href="mailto:hi@moredatafast.com">{t("contact")}</a>
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}
