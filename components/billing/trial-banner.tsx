import Link from "next/link";
import { getTranslations } from "next-intl/server";

export type TrialBannerProps = {
  trialEndsAt: string | null;
  trialActive: boolean;
  subscriptionStatus: string | null;
};

/**
 * Thin billing status strip rendered at the top of the dashboard. Does not
 * render when the org has a healthy Stripe subscription, to keep the chrome
 * quiet for paying customers.
 */
export async function TrialBanner({
  trialEndsAt,
  trialActive,
  subscriptionStatus,
}: TrialBannerProps) {
  const t = await getTranslations("dashboard.trial");

  if (subscriptionStatus === "active") return null;
  if (subscriptionStatus === "trialing") return null;

  if (subscriptionStatus === "past_due" || subscriptionStatus === "unpaid") {
    return (
      <TrialStrip
        tone="warning"
        message={t("pastDue")}
        ctaLabel={t("manageBilling")}
      />
    );
  }

  // Don't render an active-trial strip — the trial countdown lives on the
  // billing page and the nav, we don't need a chrome-wide banner nagging
  // users every page load. Payment-failure / trial-ended states still
  // surface below because those are actionable.
  if (trialActive && trialEndsAt) return null;

  return (
    <TrialStrip
      tone="danger"
      message={t("ended")}
      ctaLabel={t("endedCta")}
    />
  );
}

function TrialStrip({
  tone,
  message,
  ctaLabel,
}: {
  tone: "default" | "warning" | "danger";
  message: string;
  ctaLabel: string;
}) {
  const messageColor =
    tone === "warning"
      ? "text-mdf-warning"
      : tone === "danger"
        ? "text-mdf-danger"
        : "text-mdf-fg-2";
  return (
    <div
      className="w-full bg-mdf-bg-trial border-b border-mdf-line-1"
      style={{ minHeight: "var(--mdf-trial-h)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 sm:px-5 h-full py-1.5 sm:py-0 text-xs">
        <span className={messageColor}>{message}</span>
        <Link
          href="/settings/organization/billing"
          className="text-mdf-brand hover:text-mdf-brand-hover font-medium"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
