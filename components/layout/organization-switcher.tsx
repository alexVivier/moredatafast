"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAlert, usePrompt } from "@/components/ui/confirm-dialog";
import {
  authClient,
  useActiveOrganization,
  useListOrganizations,
} from "@/lib/auth/client";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function OrganizationSwitcher() {
  const router = useRouter();
  const { data: orgs, isPending: orgsPending } = useListOrganizations();
  const { data: activeOrg } = useActiveOrganization();
  const prompt = usePrompt();
  const alert = useAlert();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  const activeId = activeOrg?.id ?? null;
  const activeLabel =
    activeOrg?.name ?? (orgsPending ? "…" : "Select organization");

  async function handleSetActive(organizationId: string) {
    if (organizationId === activeId) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await authClient.organization.setActive({ organizationId });
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    const name = await prompt({
      title: "Create organization",
      description: "Give the new organization a name — the URL slug is generated for you.",
      placeholder: "Organization name",
      confirmLabel: "Create",
    });
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    const slug = `${slugify(trimmed) || "workspace"}-${randomSuffix()}`;
    setBusy(true);
    try {
      const res = await authClient.organization.create({
        name: trimmed,
        slug,
      });
      if (res.error) {
        await alert({
          title: "Couldn't create organization",
          description: res.error.message || "Please try again in a moment.",
          tone: "danger",
        });
        return;
      }
      if (res.data?.id) {
        await authClient.organization.setActive({ organizationId: res.data.id });
      }
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="mdf-picker disabled:opacity-60"
      >
        <Layers size={14} strokeWidth={1.5} className="text-mdf-fg-2" aria-hidden />
        <span className="hidden max-w-[140px] truncate sm:inline">
          {activeLabel}
        </span>
        <ChevronDown size={14} strokeWidth={1.5} className="text-mdf-fg-3" aria-hidden />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 max-w-[calc(100vw-1.5rem)] rounded-md border border-mdf-line-2 bg-mdf-bg-raised shadow-[var(--mdf-shadow-popover)]">
          <div className="mdf-micro px-3 py-2">Organizations</div>
          <div className="max-h-64 overflow-y-auto">
            {orgsPending ? (
              <div className="px-3 py-2 text-xs text-mdf-fg-3">Loading…</div>
            ) : !orgs || orgs.length === 0 ? (
              <div className="px-3 py-2 text-xs text-mdf-fg-3">
                No organizations yet
              </div>
            ) : (
              orgs.map((org) => {
                const isActive = org.id === activeId;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleSetActive(org.id)}
                    disabled={busy}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-mdf-line-1 disabled:opacity-60"
                  >
                    <span className="flex-1 truncate">{org.name}</span>
                    {isActive ? (
                      <span className="text-mdf-brand" aria-hidden>●</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-mdf-line-1 p-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleCreate}
              disabled={busy}
            >
              + New organization
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
