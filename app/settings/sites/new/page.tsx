import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AddSiteForm } from "@/components/forms/add-site-form";
import { Button } from "@/components/ui/button";
import { requirePageOrg } from "@/lib/auth/session";
import { getPlanPrices } from "@/lib/billing/prices";

export default async function NewSitePage() {
  await requirePageOrg("/settings/sites/new", "admin");
  const prices = await getPlanPrices();
  const t = await getTranslations("settings.siteNew");
  return (
    <div className="mx-auto max-w-xl px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            {t("back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </div>
      <AddSiteForm
        monthlyPriceLabel={prices.monthly?.display ?? null}
        yearlyPriceLabel={prices.yearly?.display ?? null}
        yearlySavingsPercent={prices.yearlySavingsPercent}
      />
    </div>
  );
}
