export default function Loading() {
  return (
    <div
      className="workspace-skeleton"
      role="status"
      aria-label="Loading your workspace"
    >
      <span className="sr-only">Loading your workspace…</span>
      <div className="skeleton eyebrow-line" />
      <div className="skeleton title-line" />
      <div className="skeleton subtitle-line" />
      <div className="skeleton-stat-grid">
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton skeleton-stat" key={i} />
        ))}
      </div>
      <div className="skeleton skeleton-panel" />
      <div className="skeleton skeleton-panel short" />
    </div>
  );
}
