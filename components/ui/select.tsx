import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  rootClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, rootClassName, children, ...props }, ref) => (
    <div className={cn("relative inline-flex", rootClassName)}>
      <select
        ref={ref}
        className={cn(
          "h-8 rounded-md border border-mdf-line-2 bg-mdf-bg-input pl-2.5 pr-7 text-sm text-mdf-fg-1",
          "appearance-none cursor-pointer",
          "hover:border-mdf-line-3",
          "focus-visible:outline-none focus-visible:border-mdf-line-3",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.5}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-mdf-fg-3"
        aria-hidden
      />
    </div>
  ),
);
Select.displayName = "Select";
