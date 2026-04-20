"use client";

import { useQueryStates, parseAsString } from "nuqs";

import {
  DATE_RANGE_LABELS,
  isDateRangePreset,
  resolveDateRange,
  type DateRangePreset,
  type ResolvedDateRange,
} from "@/lib/utils/date-range";

export function useDateRangeState(): {
  preset: DateRangePreset;
  custom: { startAt: string | null; endAt: string | null };
  resolved: ResolvedDateRange;
  setPreset: (preset: DateRangePreset) => void;
  setCustom: (startAt: string, endAt: string) => void;
} {
  const [state, setState] = useQueryStates(
    {
      preset: parseAsString.withDefault("7d"),
      startAt: parseAsString,
      endAt: parseAsString,
    },
    { history: "replace", shallow: false }
  );

  const preset: DateRangePreset = isDateRangePreset(state.preset)
    ? state.preset
    : "7d";

  const resolved = resolveDateRange(preset, {
    startAt: state.startAt ?? undefined,
    endAt: state.endAt ?? undefined,
  });

  return {
    preset,
    custom: { startAt: state.startAt, endAt: state.endAt },
    resolved,
    setPreset: (next) => {
      if (next === "custom") {
        setState({ preset: "custom" });
      } else {
        setState({ preset: next, startAt: null, endAt: null });
      }
    },
    setCustom: (startAt, endAt) => {
      setState({ preset: "custom", startAt, endAt });
    },
  };
}

export { DATE_RANGE_LABELS };
