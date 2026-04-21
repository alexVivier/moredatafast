"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { AuthTitle } from "@/components/auth/auth-parts";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const t = useTranslations("auth.verify");
  const params = useSearchParams();
  const error = params.get("error");

  if (error) {
    return (
      <>
        <AuthTitle
          title={t("failedTitle")}
          description={
            <>
              {t("failedDescriptionBefore")}
              {error}
              {t("failedDescriptionAfter")}
            </>
          }
        />
        <Link href="/login">
          <Button variant="outline" className="w-full">
            {t("back")}
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthTitle title={t("title")} description={t("description")} />
      <Link href="/login">
        <Button variant="outline" className="w-full">
          {t("back")}
        </Button>
      </Link>
    </>
  );
}
