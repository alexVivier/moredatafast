"use client";

import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/select";

export type SiteSwitcherEntry = {
  viewId: string;
  label: string;
  domain?: string;
  logoUrl?: string | null;
};

export function SiteSwitcher({
  current,
  entries,
}: {
  current: string;
  entries: SiteSwitcherEntry[];
}) {
  const router = useRouter();

  return (
    <Select
      value={current}
      onChange={(e) => {
        const next = e.target.value;
        if (next !== current) router.push(`/view/${next}`);
      }}
    >
      {entries.map((entry) => (
        <option key={entry.viewId} value={entry.viewId}>
          {entry.label}
          {entry.domain ? ` — ${entry.domain}` : ""}
        </option>
      ))}
    </Select>
  );
}
