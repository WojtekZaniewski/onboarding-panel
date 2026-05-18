export default function Loading() {
  return (
    <div className="admin-page">
      <div className="skeleton skeleton--title" />
      <div style={{ height: 24 }} />
      <div className="admin-table">
        <div className="admin-table__head">
          <span>Salon</span>
          <span>Reprezentant</span>
          <span>Status</span>
          <span></span>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="admin-table__row skeleton" style={{ height: 56 }} />
        ))}
      </div>
    </div>
  );
}
