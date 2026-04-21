"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PaywallDialog } from "@/components/billing/paywall-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";
import type { Role } from "@/lib/auth/session";

function isPaywallError(message: string): boolean {
  return /PAYWALL:|premium required/i.test(message);
}

type MemberDTO = {
  id: string;
  userId: string;
  role: Role;
  createdAt: string;
  email: string;
  name: string | null;
  image: string | null;
};

type InvitationDTO = {
  id: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: string;
  inviterEmail: string | null;
};

type Props = {
  organizationId: string;
  organizationName: string;
  currentUserId: string;
  currentRole: Role;
  canManage: boolean;
  isOwner: boolean;
  members: MemberDTO[];
  invitations: InvitationDTO[];
  monthlyPriceLabel?: string | null;
  yearlyPriceLabel?: string | null;
  yearlySavingsPercent?: number | null;
};

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function OrganizationClient({
  organizationId,
  organizationName,
  currentUserId,
  currentRole,
  canManage,
  isOwner,
  members,
  invitations,
  monthlyPriceLabel,
  yearlyPriceLabel,
  yearlySavingsPercent,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await authClient.organization.inviteMember({
        email: trimmed,
        role: inviteRole,
        organizationId,
      });
      if (res.error) {
        if (isPaywallError(res.error.message ?? "")) {
          setPaywallOpen(true);
        } else {
          setError(res.error.message || "Failed to send invitation");
        }
        return;
      }
      setEmail("");
      setInviteRole("member");
      setSuccess(`Invitation sent to ${trimmed}`);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send invitation";
      if (isPaywallError(message)) {
        setPaywallOpen(true);
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvite(invitationId: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await authClient.organization.cancelInvitation({
        invitationId,
      });
      if (res.error) {
        setError(res.error.message || "Failed to cancel invitation");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(memberId: string, memberEmail: string) {
    if (
      !window.confirm(
        `Remove ${memberEmail} from ${organizationName}? They will lose access immediately.`,
      )
    )
      return;
    setError(null);
    setBusy(true);
    try {
      const res = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId,
      });
      if (res.error) {
        setError(res.error.message || "Failed to remove member");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function leaveOrg() {
    if (
      !window.confirm(
        `Leave ${organizationName}? You'll lose access to its sites and dashboards.`,
      )
    )
      return;
    setError(null);
    setBusy(true);
    try {
      const res = await authClient.organization.leave({ organizationId });
      if (res.error) {
        setError(res.error.message || "Failed to leave organization");
        return;
      }
      router.replace("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteOrg() {
    const typed = window.prompt(
      `Type the org slug to confirm deletion (this cannot be undone):`,
    );
    if (!typed) return;
    setError(null);
    setBusy(true);
    try {
      const res = await authClient.organization.delete({ organizationId });
      if (res.error) {
        setError(res.error.message || "Failed to delete organization");
        return;
      }
      router.replace("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PaywallDialog
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        organizationId={organizationId}
        reason="invite teammates"
        monthlyPriceLabel={monthlyPriceLabel}
        yearlyPriceLabel={yearlyPriceLabel}
        yearlySavingsPercent={yearlySavingsPercent}
      />
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          {success}
        </div>
      ) : null}

      {/* Members --------------------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Members
        </h2>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {members.map((m) => {
              const isSelf = m.userId === currentUserId;
              const canRemove =
                canManage && !isSelf && m.role !== "owner";
              return (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4"
                >
                  {m.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.image}
                      alt=""
                      className="h-8 w-8 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold">
                      {(m.name || m.email).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 basis-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{m.name || m.email}</span>
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">
                          (you)
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.email}
                    </div>
                  </div>
                  <RoleBadge role={m.role} />
                  {canRemove ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(m.id, m.email)}
                      disabled={busy}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* Invitations ----------------------------------------------------- */}
      {invitations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pending invitations
          </h2>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    ✉
                  </div>
                  <div className="min-w-0 flex-1 basis-0">
                    <div className="truncate text-sm font-medium">
                      {inv.email}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Invited {inv.inviterEmail ? `by ${inv.inviterEmail} ` : ""}·
                      expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <RoleBadge role={inv.role} />
                  {canManage ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInvite(inv.id)}
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* Invite form ---------------------------------------------------- */}
      {canManage ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Invite a teammate
          </h2>
          <Card>
            <CardContent className="pt-4">
              <form
                onSubmit={submitInvite}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="teammate@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    className="h-9 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    {isOwner ? <option value="owner">Owner</option> : null}
                  </select>
                </div>
                <Button type="submit" disabled={busy}>
                  {busy ? "Sending…" : "Send invite"}
                </Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">
                They&apos;ll get an email with a link to accept. Invitations
                expire in 48 hours.
              </p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* Danger zone ---------------------------------------------------- */}
      <section className="space-y-3 pt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Danger zone
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">Leave organization</div>
              <p className="text-xs text-muted-foreground">
                You will lose access to all sites and dashboards in{" "}
                {organizationName}.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={leaveOrg}
              disabled={busy || (isOwner && members.length === 1)}
              title={
                isOwner && members.length === 1
                  ? "You're the only member — delete the organization instead."
                  : undefined
              }
            >
              Leave
            </Button>
          </CardContent>
          {isOwner ? (
            <CardContent className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium text-destructive">
                  Delete organization
                </div>
                <p className="text-xs text-muted-foreground">
                  Permanently deletes the organization, its sites, views and
                  segments. This cannot be undone.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={deleteOrg}
                disabled={busy}
              >
                Delete
              </Button>
            </CardContent>
          ) : null}
        </Card>
      </section>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const tone =
    role === "owner"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      : role === "admin"
        ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase ${tone}`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
