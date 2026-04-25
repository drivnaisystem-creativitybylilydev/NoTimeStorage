export default function AdminBookingsLoading() {
  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 0 48px' }}>
      <div className="admin-skeleton admin-skeleton-title" />
      <div className="admin-skeleton admin-skeleton-line wide" />
      <div className="admin-stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="admin-card" style={{ padding: '24px', minHeight: '100px' }}>
            <div className="admin-skeleton admin-skeleton-line short" style={{ marginBottom: 12 }} />
            <div className="admin-skeleton admin-skeleton-block" style={{ height: '32px', width: '60%' }} />
          </div>
        ))}
      </div>
      <div className="admin-card" style={{ padding: 0, minHeight: '320px' }}>
        <div className="admin-skeleton admin-skeleton-block" style={{ height: '100%', minHeight: '300px', borderRadius: '12px' }} />
      </div>
    </div>
  );
}
