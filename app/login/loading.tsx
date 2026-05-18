export default function Loading() {
  return (
    <main className="login-page">
      <div className="login-card">
        <div className="skeleton skeleton--eyebrow" />
        <div className="skeleton skeleton--hero-heading" style={{ height: 48, width: "70%" }} />
        <div className="skeleton skeleton--sub" />
        <div style={{ height: 16 }} />
        <div className="skeleton" style={{ height: 44, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 44, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 44, borderRadius: 12 }} />
      </div>
    </main>
  );
}
