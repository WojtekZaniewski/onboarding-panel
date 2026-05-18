import Link from "next/link";

export type ServiceStatus = "w_robocie" | "czeka" | "dostarczone" | "ok" | "progress" | "warn" | "done" | "default";

const STATUS_LABELS: Record<ServiceStatus, string> = {
  w_robocie: "W robocie",
  czeka: "Czeka na Ciebie",
  dostarczone: "Dostarczone",
  ok: "Aktywne",
  progress: "W przygotowaniu",
  warn: "Czeka na Ciebie",
  done: "Dostarczone",
  default: "Wkrótce",
};

const STATUS_CLASS: Record<ServiceStatus, string> = {
  w_robocie: "service__status--ok",
  czeka: "service__status--warn",
  dostarczone: "service__status--done",
  ok: "service__status--ok",
  progress: "service__status--progress",
  warn: "service__status--warn",
  done: "service__status--done",
  default: "",
};

export type ServiceCardProps = {
  icon: string;
  status: ServiceStatus;
  statusLabel?: string;
  title: string;
  body: string;
  link?: { href: string; label: string };
};

export function ServiceCard({ icon, status, statusLabel, title, body, link }: ServiceCardProps) {
  return (
    <article className="service">
      <div className="service__top">
        <span className="service__icon">{icon}</span>
        <span className={`service__status ${STATUS_CLASS[status]}`}>
          {statusLabel ?? STATUS_LABELS[status]}
        </span>
      </div>
      <h3 className="service__title">{title}</h3>
      <p className="service__body">{body}</p>
      {link && (
        <Link href={link.href} className="service__link">
          {link.label} →
        </Link>
      )}
    </article>
  );
}
