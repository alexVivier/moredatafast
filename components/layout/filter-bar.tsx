"use client";

import { Filter, Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  FILTER_KEYS,
  FILTER_LABELS,
  type FilterKey,
} from "@/lib/filters/schema";
import { useFilters } from "@/lib/hooks/use-filters";

export function FilterBar() {
  const { filters, count, set, clear } = useFilters();
  const [editing, setEditing] = useState<FilterKey | null>(null);

  const entries = FILTER_KEYS.filter((k) => (filters[k]?.length ?? 0) > 0).map(
    (k) => [k, filters[k]!] as const
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setEditing(FILTER_KEYS[0])}
      >
        <Plus size={14} strokeWidth={1.5} />
        Filter
      </Button>

      {entries.map(([k, values]) => (
        <button
          key={k}
          type="button"
          onClick={() => setEditing(k)}
          className="inline-flex items-center gap-1.5 h-8 rounded-md border border-border bg-accent/30 hover:bg-accent/60 transition-colors px-2 text-xs font-medium"
        >
          <Filter size={12} strokeWidth={1.5} className="text-mdf-fg-3" />
          <span>{FILTER_LABELS[k]}</span>
          <span className="text-muted-foreground">is</span>
          <span
            className="max-w-[200px] truncate"
            title={values.join(", ")}
          >
            {values.slice(0, 2).join(", ")}
            {values.length > 2 ? ` +${values.length - 2}` : ""}
          </span>
          <span
            role="button"
            tabIndex={0}
            aria-label={`Clear ${FILTER_LABELS[k]}`}
            onClick={(e) => {
              e.stopPropagation();
              clear(k);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                clear(k);
              }
            }}
            className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted text-muted-foreground"
          >
            <X size={12} strokeWidth={1.5} />
          </span>
        </button>
      ))}

      {count > 0 ? (
        <Button variant="ghost" size="sm" onClick={() => clear()}>
          Clear all
        </Button>
      ) : null}

      {editing ? (
        <EditFilterDialog
          field={editing}
          currentValues={filters[editing] ?? []}
          onSave={(values) => {
            set(editing, values);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
          onFieldChange={(k) => setEditing(k)}
        />
      ) : null}
    </div>
  );
}

function EditFilterDialog({
  field,
  currentValues,
  onSave,
  onCancel,
  onFieldChange,
}: {
  field: FilterKey;
  currentValues: string[];
  onSave: (values: string[]) => void;
  onCancel: () => void;
  onFieldChange: (k: FilterKey) => void;
}) {
  const [raw, setRaw] = useState(currentValues.join(", "));

  const commit = () => {
    const values = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSave(values);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="mt-4 sm:mt-24 mx-3 sm:mx-0 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-lg border border-border bg-card text-card-foreground shadow-lg p-4"
        role="dialog"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Filter</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={14} strokeWidth={1.5} />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Field
            </label>
            <Select
              value={field}
              onChange={(e) => onFieldChange(e.target.value as FilterKey)}
              rootClassName="w-full"
              className="w-full"
            >
              {FILTER_KEYS.map((k) => (
                <option key={k} value={k}>
                  {FILTER_LABELS[k]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Value(s) <span className="text-muted-foreground/70">(comma-separated for multiple)</span>
            </label>
            <Input
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder='e.g. "United States, Canada"'
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") onCancel();
              }}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Tip: match what DataFast shows in your widgets — e.g. country names (not codes).
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={commit} disabled={raw.trim().length === 0}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
