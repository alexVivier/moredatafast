"use client";

import { useMemo } from "react";
import { useQueryStates, parseAsString } from "nuqs";

import { FILTER_KEYS, type FilterKey, type Filters } from "@/lib/filters/schema";

const parsers = Object.fromEntries(
  FILTER_KEYS.map((k) => [`f_${k}`, parseAsString])
) as Record<string, typeof parseAsString>;

function urlKey(k: FilterKey): string {
  return `f_${k}`;
}

function parseList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function stringifyList(values: string[]): string | null {
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(",") : null;
}

export type UseFiltersResult = {
  filters: Filters;
  count: number;
  set: (key: FilterKey, values: string[]) => void;
  toggle: (key: FilterKey, value: string) => void;
  clear: (key?: FilterKey) => void;
  replaceAll: (next: Filters) => void;
};

export function useFilters(): UseFiltersResult {
  const [state, setState] = useQueryStates(parsers, {
    history: "replace",
    shallow: false,
  });

  const filters = useMemo(() => {
    const f: Filters = {};
    for (const k of FILTER_KEYS) {
      const values = parseList(state[urlKey(k)] as string | null | undefined);
      if (values.length > 0) f[k] = values;
    }
    return f;
  }, [state]);

  const count = useMemo(
    () => Object.values(filters).reduce((acc, v) => acc + (v?.length ?? 0), 0),
    [filters]
  );

  const set = (key: FilterKey, values: string[]) => {
    setState({ [urlKey(key)]: stringifyList(values) } as Record<string, string | null>);
  };

  const toggle = (key: FilterKey, value: string) => {
    const current = filters[key] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    set(key, next);
  };

  const clear = (key?: FilterKey) => {
    if (key) {
      setState({ [urlKey(key)]: null } as Record<string, string | null>);
      return;
    }
    const cleared = Object.fromEntries(
      FILTER_KEYS.map((k) => [urlKey(k), null])
    );
    setState(cleared as Record<string, string | null>);
  };

  const replaceAll = (next: Filters) => {
    const payload = Object.fromEntries(
      FILTER_KEYS.map((k) => [urlKey(k), stringifyList(next[k] ?? [])])
    );
    setState(payload as Record<string, string | null>);
  };

  return { filters, count, set, toggle, clear, replaceAll };
}
