"use client";

import { useTransition } from "react";

export function DeleteButton({
  action,
  label = "Usuń",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="admin-row-card__delete"
      disabled={pending}
      onClick={() => {
        if (confirm("Na pewno usunąć?")) {
          start(async () => {
            await action();
          });
        }
      }}
    >
      {pending ? "..." : label}
    </button>
  );
}
