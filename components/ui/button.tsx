import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "brand";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  // Primary CTAs (+ Add widget, + Add site, Sign in)
  default:
    "bg-mdf-fg-1 text-mdf-fg-inverse border border-mdf-fg-1 hover:bg-[color-mix(in_srgb,var(--mdf-fg-1)_92%,transparent)] hover:border-[color-mix(in_srgb,var(--mdf-fg-1)_92%,transparent)]",
  primary:
    "bg-mdf-fg-1 text-mdf-fg-inverse border border-mdf-fg-1 hover:bg-[color-mix(in_srgb,var(--mdf-fg-1)_92%,transparent)] hover:border-[color-mix(in_srgb,var(--mdf-fg-1)_92%,transparent)]",
  // Neutral hairline button
  secondary:
    "bg-transparent text-mdf-fg-1 border border-mdf-line-2 hover:border-mdf-line-3",
  outline:
    "bg-transparent text-mdf-fg-1 border border-mdf-line-2 hover:border-mdf-line-3",
  // No border, faint hover
  ghost:
    "bg-transparent text-mdf-fg-2 border border-transparent hover:text-mdf-fg-1 hover:bg-mdf-line-1",
  // Red text, transparent; hover faint red bg
  destructive:
    "bg-transparent text-mdf-danger border border-transparent hover:bg-[color-mix(in_srgb,var(--mdf-danger)_8%,transparent)]",
  // Orange — trial / upgrade only
  brand:
    "bg-mdf-brand text-mdf-brand-ink border border-mdf-brand font-medium hover:bg-mdf-brand-hover hover:border-mdf-brand-hover",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs rounded-md",
  md: "h-8 px-3 text-sm rounded-md",
  lg: "h-9 px-4 text-sm rounded-md",
  icon: "h-8 w-8 rounded-md",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium transition-[background,border-color,color]",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:border-mdf-line-3",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
