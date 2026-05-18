export type NotifRowProps = {
  isNew?: boolean;
  title: string;
  meta: string;
  actionHref?: string;
  actionLabel?: string;
};

export function NotifRow({
  isNew,
  title,
  meta,
  actionHref = "#",
  actionLabel = "Otwórz",
}: NotifRowProps) {
  return (
    <li className={"notif" + (isNew ? " notif--new" : "")}>
      {isNew && <span className="notif__dot" />}
      <div className="notif__info">
        <div className="notif__title">{title}</div>
        <div className="notif__meta">{meta}</div>
      </div>
      <a href={actionHref} className="notif__action">
        {actionLabel}
      </a>
    </li>
  );
}
