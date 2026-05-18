export type DocRowProps = {
  icon: string;
  name: string;
  meta: string;
  href?: string;
  category?: string;
};

export function DocRow({ icon, name, meta, href = "#", category }: DocRowProps) {
  return (
    <li className="doc" data-cat={category}>
      <span className="doc__icon">{icon}</span>
      <div className="doc__info">
        <div className="doc__name">{name}</div>
        <div className="doc__meta">{meta}</div>
      </div>
      <a href={href} className="doc__action" download>
        Pobierz
      </a>
    </li>
  );
}
