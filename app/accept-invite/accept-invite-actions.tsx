"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { authClient } from "@/lib/auth/client";

export function AcceptInviteActions({
  invitationId,
}: {
  invitationId: string;
}) {
  const t = useTranslations("settings.acceptInvite");
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setError(null);
    setBusy(true);
    try {
      const res = await authClient.organization.acceptInvitation({
        invitationId,
      });
      if (res.error) {
        setError(res.error.message || t("errAccept"));
        return;
      }
      router.replace("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    const ok = await confirm({
      title: t("decline"),
      description: t("confirmDecline"),
      confirmLabel: t("decline"),
      tone: "danger",
    });
    if (!ok) return;
    setError(null);
    setBusy(true);
    try {
      const res = await authClient.organization.rejectInvitation({
        invitationId,
      });
      if (res.error) {
        setError(res.error.message || t("errDecline"));
        return;
      }
      router.replace("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Button onClick={accept} disabled={busy}>
          {busy ? t("joining") : t("accept")}
        </Button>
        <Button variant="outline" onClick={reject} disabled={busy}>
          {t("decline")}
        </Button>
      </div>
    </div>
  );
}
