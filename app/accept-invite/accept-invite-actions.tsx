"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function AcceptInviteActions({
  invitationId,
}: {
  invitationId: string;
}) {
  const router = useRouter();
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
        setError(res.error.message || "Failed to accept invitation");
        return;
      }
      // The plugin flips activeOrganizationId server-side; a router refresh is
      // enough to re-render RSCs with the new org.
      router.replace("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!window.confirm("Decline this invitation?")) return;
    setError(null);
    setBusy(true);
    try {
      const res = await authClient.organization.rejectInvitation({
        invitationId,
      });
      if (res.error) {
        setError(res.error.message || "Failed to decline invitation");
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
          {busy ? "Joining…" : "Accept invitation"}
        </Button>
        <Button variant="outline" onClick={reject} disabled={busy}>
          Decline
        </Button>
      </div>
    </div>
  );
}
