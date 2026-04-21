"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import { AuthTitle } from "@/components/auth/auth-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgot");
  const common = useTranslations("common");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      setSent(true);
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <>
        <AuthTitle
          title={t("sentTitle")}
          description={
            <>
              {t("sentBeforeEmail")}
              <strong className="text-mdf-fg-1">{email}</strong>
              {t("sentAfterEmail")}
            </>
          }
        />
        <Link href="/login">
          <Button variant="outline" className="w-full">
            {t("sentBack")}
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthTitle title={t("title")} description={t("description")} />

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">{common("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-mdf-fg-3">
        {t("rememberBefore")}{" "}
        <Link
          href="/login"
          className="text-mdf-fg-1 underline underline-offset-2 hover:text-mdf-brand"
        >
          {t("rememberLink")}
        </Link>
      </p>
    </>
  );
}
