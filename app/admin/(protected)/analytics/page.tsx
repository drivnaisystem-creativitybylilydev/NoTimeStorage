import { getAnalyticsData } from '@/lib/admin/actions';
import { AnalyticsView } from './AnalyticsView';

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-coffee)', margin: '0 0 6px' }}>
          Analytics
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-500)', margin: 0 }}>
          Revenue, bookings, and trends across all campuses.
        </p>
      </div>

      <AnalyticsView data={data} />
    </div>
  );
}
