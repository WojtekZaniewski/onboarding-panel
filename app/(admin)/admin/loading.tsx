export default function Loading() {
  return (
    <div className="admin-page">
      <div className="skeleton skeleton--title" />
      <div className="admin-stats">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="admin-stat skeleton" style={{ height: 96 }} />
        ))}
      </div>
      <div className="admin-cols">
        <section className="admin-card">
          <div className="skeleton skeleton--head" />
          <ul className="admin-list">
            {[0, 1, 2].map((i) => (
              <li key={i} className="skeleton" style={{ height: 44 }} />
            ))}
          </ul>
        </section>
        <section className="admin-card">
          <div className="skeleton skeleton--head" />
          <ul className="admin-list">
            {[0, 1, 2].map((i) => (
              <li key={i} className="skeleton" style={{ height: 44 }} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
