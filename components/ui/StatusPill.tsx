import type { ReactNode } from "react";

export type StatusPillVariant = "default" | "ok" | "accent";

export function StatusPill({
  variant = "default",
  icon,
  dot,
  children,
}: {
  variant?: StatusPillVariant;
  icon?: ReactNode;
  dot?: boolean;
  children: ReactNode;
}) {
  const klass = [
    "status-pill",
    variant === "ok" ? "status-pill--ok" : "",
    variant === "accent" ? "status-pill--accent" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={klass}>
      {dot && <span className="status-pill__dot" />}
      {icon && <span className="status-pill__icon">{icon}</span>}
      {children}
    </div>
  );
}
