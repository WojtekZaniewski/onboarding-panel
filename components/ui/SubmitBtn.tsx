"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function SubmitBtn({
  children,
  pendingLabel = "Chwila…",
  className = "btn btn--primary",
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className + (pending ? " is-pending" : "")} disabled={pending}>
      {pending ? (
        <>
          <span className="submit-spinner" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
