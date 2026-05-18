export type AssetProps = {
  iconText?: string;
  iconStyle?: React.CSSProperties;
  title: string;
  meta: string;
  href?: string;
};

export function Asset({ iconText, iconStyle, title, meta, href = "#" }: AssetProps) {
  return (
    <a href={href} className="asset">
      <div className="asset__icon" style={iconStyle}>
        {iconText}
      </div>
      <div className="asset__title">{title}</div>
      <div className="asset__meta">{meta}</div>
    </a>
  );
}
