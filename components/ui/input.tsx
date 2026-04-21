import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-8 w-full rounded-md border border-mdf-line-2 bg-mdf-bg-input px-3 py-1 text-sm text-mdf-fg-1",
      "placeholder:text-mdf-fg-3",
      "focus-visible:outline-none focus-visible:border-mdf-line-3",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
