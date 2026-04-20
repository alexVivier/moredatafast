"use client";

import { GripVertical, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function WidgetFrame({
  title,
  subtitle,
  editMode,
  onRemove,
  children,
  className,
}: {
  title: string;
  subtitle?: string | null;
  editMode: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden",
        editMode && "ring-offset-background",
        className
      )}
    >
      {editMode ? (
        <div className="flex items-center gap-2 px-2 py-1 border-b border-border bg-muted/30">
          <span
            className="drag-handle cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted"
            aria-label="Drag"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <div className="flex-1 min-w-0 text-xs font-medium truncate">
            {title}
            {subtitle ? (
              <span className="ml-2 text-muted-foreground font-normal">
                {subtitle}
              </span>
            ) : null}
          </div>
          {onRemove ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-destructive"
              onClick={onRemove}
              aria-label="Remove widget"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="flex-1 min-h-0 p-3">{children}</div>
    </div>
  );
}
