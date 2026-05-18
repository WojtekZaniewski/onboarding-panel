import type { ReactNode } from "react";

export function ListSection({
  title,
  description,
  children,
  newForm,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  newForm: ReactNode;
}) {
  return (
    <section className="admin-form-section">
      <h2>{title}</h2>
      {description && <p className="admin-hint">{description}</p>}
      <div className="admin-list-editor">{children}</div>
      <div className="admin-new-form">
        <h3>Dodaj nowy</h3>
        {newForm}
      </div>
    </section>
  );
}

export function RowCard({ children }: { children: ReactNode }) {
  return <div className="admin-row-card">{children}</div>;
}
