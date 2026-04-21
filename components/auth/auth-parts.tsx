import type { ReactNode } from "react";

export function AuthTitle({
  title,
  description,
}: {
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="mb-5">
      <h1
        className="text-mdf-fg-1"
        style={{
          fontFamily: "var(--mdf-font-display)",
          fontSize: 28,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-1.5 text-sm text-mdf-fg-2 leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

export function AuthDivider({ label = "OR" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-mdf-line-1" />
      <span className="mdf-micro">{label}</span>
      <span className="h-px flex-1 bg-mdf-line-1" />
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-mdf-line-1 px-3 py-2 text-xs text-mdf-danger"
      style={{
        background: "color-mix(in srgb, var(--mdf-danger) 8%, transparent)",
      }}
    >
      {message}
    </div>
  );
}

export function AuthFootNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 text-center text-xs text-mdf-fg-3">{children}</p>
  );
}
