"use client";

import { useTransition } from "react";

export function Switch({
  checked,
  label,
  onToggle,
  size = "md",
}: {
  checked: boolean;
  label?: string;
  onToggle: (next: boolean) => Promise<void>;
  size?: "sm" | "md";
}) {
  const [pending, start] = useTransition();
  const cls = "switch" + (size === "sm" ? " switch--sm" : "") + (checked ? " switch--on" : "");
  return (
    <label className={cls}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={pending}
        className="switch__btn"
        onClick={() => {
          start(async () => {
            await onToggle(!checked);
          });
        }}
      >
        <span className="switch__knob" />
      </button>
      {label && <span className="switch__label">{label}</span>}
    </label>
  );
}
