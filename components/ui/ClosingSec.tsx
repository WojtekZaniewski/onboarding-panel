import type { ReactNode } from "react";

export function ClosingSec({
  lead,
  body,
  tag,
  ctaIntro,
  buttons,
}: {
  lead: ReactNode;
  body?: ReactNode;
  tag?: ReactNode;
  ctaIntro?: ReactNode;
  buttons?: ReactNode;
}) {
  return (
    <section className="closing-sec">
      <div className="closing-sec__inner">
        <p className="closing-sec__lead">{lead}</p>
        {body && <p className="closing-sec__body">{body}</p>}
        {tag && <p className="closing-sec__tag">{tag}</p>}
        {ctaIntro && <p className="closing-sec__cta-row">{ctaIntro}</p>}
        {buttons && <div className="closing-sec__buttons">{buttons}</div>}
      </div>
    </section>
  );
}
