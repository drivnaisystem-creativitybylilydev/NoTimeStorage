export default function AdminCustomersLoading() {
  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 0 48px' }}>
      <div className="admin-skeleton admin-skeleton-title" />
      <div className="admin-skeleton admin-skeleton-line wide" />
      <div className="admin-skeleton admin-skeleton-line" />
      <div className="admin-stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="admin-card" style={{ padding: '28px', minHeight: '120px' }}>
            <div className="admin-skeleton admin-skeleton-line short" style={{ marginBottom: 16 }} />
            <div className="admin-skeleton admin-skeleton-block tall" />
          </div>
        ))}
      </div>
      <div className="admin-card" style={{ padding: 0, minHeight: '280px', overflow: 'hidden' }}>
        <div className="admin-skeleton admin-skeleton-block" style={{ height: '100%', minHeight: '260px', borderRadius: 0 }} />
      </div>
    </div>
  );
}
