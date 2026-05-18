"use client";

import { useTransition, type ReactNode } from "react";

export function Chip({
  icon,
  title,
  meta,
  badge,
  onDelete,
  highlight,
  children,
}: {
  icon?: ReactNode;
  title: string;
  meta?: string;
  badge?: ReactNode;
  onDelete?: () => Promise<void>;
  highlight?: boolean;
  children?: ReactNode;
}) {
  const [pending, start] = useTransition();
  return (
    <div className={"chip" + (highlight ? " chip--highlight" : "")}>
      {icon && <span className="chip__icon">{icon}</span>}
      <div className="chip__body">
        <div className="chip__title">{title}</div>
        {meta && <div className="chip__meta">{meta}</div>}
        {children}
      </div>
      {badge && <span className="chip__badge">{badge}</span>}
      {onDelete && (
        <button
          type="button"
          className="chip__del"
          disabled={pending}
          aria-label="Usuń"
          onClick={() => {
            if (!confirm("Usunąć?")) return;
            start(async () => {
              await onDelete();
            });
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
