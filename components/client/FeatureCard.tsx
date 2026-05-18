export type FeatureStat = { num: string; label: string };

export type FeatureCardProps = {
  label: string;
  title: string;
  meta: string;
  stats: FeatureStat[];
};

export function FeatureCard({ label, title, meta, stats }: FeatureCardProps) {
  return (
    <div className="feature-card">
      <div className="feature-card__left">
        <div className="feature-card__label">{label}</div>
        <div className="feature-card__title">{title}</div>
        <div className="feature-card__meta">{meta}</div>
      </div>
      <div className="feature-card__right">
        <div className="feature-stats">
          {stats.map((s, i) => (
            <div className="feature-stat" key={i}>
              <div className="feature-stat__num">{s.num}</div>
              <div className="feature-stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
