import type { ReactNode } from "react";

type SecProps = {
  id?: string;
  dark?: boolean;
  wide?: boolean;
  num?: string;
  title?: ReactNode;
  sub?: ReactNode;
  headRow?: ReactNode;
  closing?: ReactNode;
  children: ReactNode;
};

export function Sec({ id, dark, wide, num, title, sub, headRow, closing, children }: SecProps) {
  const secClass = ["sec", dark ? "sec--dark" : ""].filter(Boolean).join(" ");
  const innerClass = ["sec__inner", wide ? "sec__inner--wide" : ""].filter(Boolean).join(" ");

  return (
    <section id={id} className={secClass}>
      <div className={innerClass}>
        {(num || title || sub || headRow) && (
          <div className={`sec__head${headRow ? " sec__head--row" : ""}`}>
            <div>
              {num && <span className="sec__num">{num}</span>}
              {title && <h2 className="sec__title">{title}</h2>}
              {sub && <p className="sec__sub">{sub}</p>}
            </div>
            {headRow}
          </div>
        )}
        {children}
        {closing && <p className="section-closing">{closing}</p>}
      </div>
    </section>
  );
}
