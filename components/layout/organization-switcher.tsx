"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
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
    const name = window.prompt("Name of the new organization?");
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
        window.alert(res.error.message || "Failed to create organization");
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
        className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm hover:bg-accent/50 disabled:opacity-60"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-[10px] font-semibold uppercase">
          {activeLabel.slice(0, 1) || "?"}
        </span>
        <span className="hidden max-w-[140px] truncate sm:inline">
          {activeLabel}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-popover shadow-md">
          <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Organizations
          </div>
          <div className="max-h-64 overflow-y-auto">
            {orgsPending ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Loading…
              </div>
            ) : !orgs || orgs.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
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
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 disabled:opacity-60"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-[10px] font-semibold uppercase shrink-0">
                      {org.name.slice(0, 1)}
                    </span>
                    <span className="flex-1 truncate text-left">{org.name}</span>
                    {isActive ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M3 8L6.5 11.5L13 5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-border p-1">
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
