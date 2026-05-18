"use client";

import { useTransition } from "react";

export type ToggleOption = {
  value: string;
  label: string;
  variant: "default" | "ok" | "active" | "done" | "warn";
};

export function StatusToggle3({
  value,
  options,
  onSet,
}: {
  value: string;
  options: ToggleOption[];
  onSet: (next: string) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="status-toggle3" role="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={pending || active}
            className={
              "status-toggle3__btn" +
              (active ? ` status-toggle3__btn--active status-toggle3__btn--${o.variant}` : "")
            }
            onClick={() => {
              if (active) return;
              start(async () => {
                await onSet(o.value);
              });
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
