"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function UserMenu({
  email,
  name,
  image,
}: {
  email: string;
  name: string | null;
  image: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  const label = name?.trim() || email;
  const initial = (name || email).slice(0, 1).toUpperCase();

  async function onSignOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-transparent hover:border-border px-2 py-1.5 text-sm"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-6 w-6 rounded-full" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-primary/10 text-xs font-medium flex items-center justify-center">
            {initial}
          </div>
        )}
        <span className="hidden sm:inline max-w-[140px] truncate">{label}</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full mt-1 w-56 max-w-[calc(100vw-1.5rem)] rounded-md border border-border bg-popover shadow-md z-50">
          <div className="px-3 py-2 border-b border-border">
            <div className="text-xs font-medium truncate">{name || "—"}</div>
            <div className="text-xs text-muted-foreground truncate">{email}</div>
          </div>
          <div className="p-1">
            <Link href="/settings/organization" onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                Organization settings
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={onSignOut}
            >
              Log out
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
