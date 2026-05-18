import { Btn } from "@/components/ui/Btn";

export type Caretaker = {
  fullName: string;
  initials: string;
  role: string;
  phone: string;
  email: string;
  whatsappUrl?: string;
};

export function CareCard({ data }: { data: Caretaker }) {
  return (
    <div className="care-card">
      <div className="care-card__avatar">{data.initials}</div>
      <div className="care-card__info">
        <div className="care-card__name">{data.fullName}</div>
        <div className="care-card__role">{data.role}</div>
        <div className="care-card__contact">
          <a href={`tel:${data.phone.replace(/\s/g, "")}`}>{data.phone}</a>
          <a href={`mailto:${data.email}`}>{data.email}</a>
          {data.whatsappUrl && (
            <a href={data.whatsappUrl} target="_blank" rel="noopener">
              WhatsApp
            </a>
          )}
        </div>
        <div className="care-card__actions">
          <Btn href={`tel:${data.phone.replace(/\s/g, "")}`} variant="primary" small>
            Zadzwoń
          </Btn>
          {data.whatsappUrl && (
            <Btn href={data.whatsappUrl} variant="ghost" small target="_blank" rel="noopener">
              WhatsApp
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
