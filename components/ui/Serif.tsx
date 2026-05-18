import type { ReactNode } from "react";

export function Serif({ children }: { children: ReactNode }) {
  return <em className="serif">{children}</em>;
}
