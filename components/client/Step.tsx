export type StepStatus = "done" | "active" | "upcoming";

const BADGE_LABEL: Record<StepStatus, string> = {
  done: "Zrobione",
  active: "W toku",
  upcoming: "Wkrótce",
};

const BADGE_CLASS: Record<StepStatus, string> = {
  done: "step__badge--done",
  active: "step__badge--active",
  upcoming: "",
};

export type StepProps = {
  code: string;
  title: string;
  body: string;
  status?: StepStatus;
  badgeLabel?: string;
};

export function Step({ code, title, body, status, badgeLabel }: StepProps) {
  const klass =
    "step" +
    (status === "done" ? " step--done" : "") +
    (status === "active" ? " step--active" : "");

  return (
    <div className={klass}>
      <div className="step__num">{code}</div>
      <div className="step__content">
        <div className="step__meta">
          <span className="step__title">{title}</span>
          {status && (
            <span className={`step__badge ${BADGE_CLASS[status]}`}>
              {badgeLabel ?? BADGE_LABEL[status]}
            </span>
          )}
        </div>
        <p className="step__body">{body}</p>
      </div>
    </div>
  );
}
