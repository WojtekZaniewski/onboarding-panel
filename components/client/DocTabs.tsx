"use client";

import { useState, type ReactNode } from "react";

export type DocTabsItem = { value: string; label: string };

export function DocTabs({
  tabs,
  children,
}: {
  tabs: DocTabsItem[];
  children: ReactNode;
}) {
  const [active, setActive] = useState(tabs[0]?.value ?? "all");
  return (
    <div data-active-cat={active} className="doc-filter">
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.value}
            className={"tab" + (active === t.value ? " is-active" : "")}
            onClick={() => setActive(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
