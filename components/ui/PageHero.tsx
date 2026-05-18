import type { ReactNode } from "react";

export function PageHero({
  eyebrowLabel,
  eyebrowAccent,
  title,
  sub,
}: {
  eyebrowLabel: string;
  eyebrowAccent: string;
  title: ReactNode;
  sub: ReactNode;
}) {
  return (
    <header className="page-hero">
      <div className="page-hero__eyebrow">
        {eyebrowLabel} · <span>{eyebrowAccent}</span>
      </div>
      <h1 className="page-hero__title">{title}</h1>
      <p className="page-hero__sub">{sub}</p>
    </header>
  );
}
