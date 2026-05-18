"use client";

import { useRef, useTransition, type ReactNode } from "react";

export function QuickAdd({
  action,
  children,
  submitLabel = "Dodaj",
}: {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  submitLabel?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ref.current) return;
    const fd = new FormData(ref.current);
    start(async () => {
      await action(fd);
      ref.current?.reset();
    });
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="quick-add">
      {children}
      <button type="submit" className="btn btn--primary btn--small quick-add__submit" disabled={pending}>
        {pending ? "..." : submitLabel}
      </button>
    </form>
  );
}
