import Link from "next/link";

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
export function TrialBanner({
  trialEndsAt,
  trialActive,
  subscriptionStatus,
}: TrialBannerProps) {
  // Healthy states → no banner.
  if (subscriptionStatus === "active") return null;
  if (subscriptionStatus === "trialing") return null;

  // Past-due or unpaid → urgent nudge to fix the card.
  if (subscriptionStatus === "past_due" || subscriptionStatus === "unpaid") {
    return (
      <div className="w-full border-b border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs sm:px-6">
          <span>
            Payment failed on your last Premium invoice. Update your card to
            keep adding sites and inviting teammates.
          </span>
          <Link
            href="/settings/organization/billing"
            className="font-medium underline hover:opacity-80"
          >
            Manage billing →
          </Link>
        </div>
      </div>
    );
  }

  // Trial running: show a countdown.
  if (trialActive && trialEndsAt) {
    const end = new Date(trialEndsAt);
    const days = Math.max(
      0,
      Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
    return (
      <div className="w-full border-b border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs sm:px-6">
          <span>
            Free trial: {days} day{days === 1 ? "" : "s"} left
          </span>
          <Link
            href="/settings/organization/billing"
            className="font-medium underline hover:opacity-80"
          >
            Upgrade now →
          </Link>
        </div>
      </div>
    );
  }

  // Trial elapsed, no active sub → hard nudge.
  return (
    <div className="w-full border-b border-destructive/40 bg-destructive/10 text-destructive">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs sm:px-6">
        <span>
          Trial ended. Upgrade to Premium to add sites or invite teammates.
        </span>
        <Link
          href="/settings/organization/billing"
          className="font-medium underline hover:opacity-80"
        >
          Upgrade →
        </Link>
      </div>
    </div>
  );
}
