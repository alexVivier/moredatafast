"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Moon, Sun } from "lucide-react";

import { authClient } from "@/lib/auth/client";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { useTheme } from "@/lib/hooks/use-theme";

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

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
      <button type="button" onClick={() => setOpen((v) => !v)} className="mdf-picker">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-[18px] w-[18px] rounded-full" />
        ) : (
          <span
            className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ background: "var(--mdf-info)" }}
          >
            {initial}
          </span>
        )}
        <span className="hidden sm:inline max-w-[140px] truncate">{label}</span>
        <ChevronDown size={14} strokeWidth={1.5} className="text-mdf-fg-3" aria-hidden />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 max-w-[calc(100vw-1.5rem)] rounded-md border border-mdf-line-2 bg-mdf-bg-raised shadow-[var(--mdf-shadow-popover)]">
          <div className="px-3 py-2 border-b border-mdf-line-1">
            <div className="text-xs font-medium text-mdf-fg-1 truncate">{name || "—"}</div>
            <div className="text-xs text-mdf-fg-3 truncate">{email}</div>
          </div>
          <nav className="p-1">
            <MenuItem href="/settings/organization" onClick={() => setOpen(false)}>
              Organization settings
            </MenuItem>
            <MenuItem
              href="/settings/organization/billing"
              onClick={() => setOpen(false)}
            >
              Billing
            </MenuItem>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setFeedbackOpen(true);
              }}
              className="w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-mdf-line-1 text-mdf-fg-1"
            >
              Send feedback
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm rounded-sm hover:bg-mdf-line-1 text-mdf-fg-1"
            >
              <span>Theme</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-mdf-fg-3">
                {theme === "dark" ? (
                  <Moon size={14} strokeWidth={1.5} />
                ) : (
                  <Sun size={14} strokeWidth={1.5} />
                )}
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-mdf-line-1 text-mdf-fg-1"
            >
              Log out
            </button>
          </nav>
        </div>
      ) : null}
      <FeedbackDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}

function MenuItem({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-1.5 text-sm rounded-sm hover:bg-mdf-line-1 text-mdf-fg-1"
    >
      {children}
    </Link>
  );
}
