type StatsCardProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: 'default' | 'success' | 'warning';
};

export function StatsCard({ label, value, helper, tone = 'default' }: StatsCardProps) {
  const borderColor =
    tone === 'success'
      ? '#16a34a'
      : tone === 'warning'
      ? '#f97316'
      : 'var(--color-latte-soft)';
  const shadowColor =
    tone === 'success'
      ? 'rgba(22, 163, 74, 0.12)'
      : tone === 'warning'
      ? 'rgba(249, 115, 22, 0.12)'
      : 'rgba(75, 46, 37, 0.08)';

  return (
    <div
      style={{
        padding: '24px',
        borderRadius: '16px',
        background: 'var(--color-white)',
        border: `1.5px solid ${borderColor}`,
        boxShadow: `0 18px 40px ${shadowColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-coffee)' }}>{value}</div>
      {helper && (
        <div style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)' }}>
          {helper}
        </div>
      )}
    </div>
  );
}

