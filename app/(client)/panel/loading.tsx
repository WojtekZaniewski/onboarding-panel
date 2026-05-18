export default function Loading() {
  return (
    <>
      <header className="hero">
        <div className="skeleton skeleton--eyebrow" />
        <div className="skeleton skeleton--hero-heading" />
        <div className="skeleton skeleton--sub" />
        <div className="status-pills">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton--pill" />
          ))}
        </div>
      </header>
      <section className="sec">
        <div className="sec__inner">
          <div className="skeleton skeleton--num" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--sub" />
          <div style={{ height: 16 }} />
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8, borderRadius: 14 }} />
          ))}
        </div>
      </section>
    </>
  );
}
