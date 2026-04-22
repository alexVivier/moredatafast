"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAlert, useConfirm } from "@/components/ui/confirm-dialog";

export function DeleteSiteButton({
  siteId,
  siteName,
}: {
  siteId: string;
  siteName: string;
}) {
  const t = useTranslations("dialogs.deleteSite");
  const tc = useTranslations("common");
  const router = useRouter();
  const confirm = useConfirm();
  const alert = useAlert();
  const [isDeleting, setIsDeleting] = useState(false);

  async function onDelete() {
    const ok = await confirm({
      title: t("remove"),
      description: t("confirm", { name: siteName }),
      confirmLabel: t("remove"),
      tone: "danger",
    });
    if (!ok) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sites/${siteId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        await alert({
          title: tc("error"),
          description: body.error || t("errDelete"),
          tone: "danger",
        });
        return;
      }
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onDelete}
      disabled={isDeleting}
      className="text-destructive hover:text-destructive"
    >
      {isDeleting ? t("removing") : t("remove")}
    </Button>
  );
}
