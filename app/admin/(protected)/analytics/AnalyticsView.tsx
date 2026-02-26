'use client';

import type { AnalyticsData } from '@/lib/admin/actions';

const SCHOOL_COLORS: Record<string, string> = {
  'Stonehill College':       '#4B2E25',
  'University of New Haven': '#1B4F72',
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:       { label: 'Confirmed',    color: '#1A7F4B', bg: '#D1FAE5' },
  pending:         { label: 'Pending',      color: '#B45309', bg: '#FEF3C7' },
  pending_payment: { label: 'Unpaid',       color: '#B45309', bg: '#FEF3C7' },
  cancelled:       { label: 'Cancelled',    color: '#991B1B', bg: '#FEE2E2' },
};

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function delta(current: number, prev: number) {
  if (prev === 0) return null;
  const pct = Math.round(((current - prev) / prev) * 100);
  return { pct, up: pct >= 0 };
}

function KpiCard({ label, value, sub, deltaVal, color }: {
  label: string; value: string; sub?: string;
  deltaVal?: { pct: number; up: boolean } | null;
  color?: string;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E7D3BF', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '180px' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: color || '#4B2E25', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#aaa' }}>{sub}</div>}
      {deltaVal && (
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: deltaVal.up ? '#1A7F4B' : '#C41E3A', display: 'flex', alignItems: 'center', gap: '3px' }}>
          {deltaVal.up ? '▲' : '▼'} {Math.abs(deltaVal.pct)}% vs last month
        </div>
      )}
    </div>
  );
}

function BarChart({ data, valueKey, labelKey, colorFn, formatValue }: {
  data: any[];
  valueKey: string;
  labelKey: string;
  colorFn?: (item: any) => string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((item, i) => {
        const val = item[valueKey];
        const pct = (val / max) * 100;
        const color = colorFn ? colorFn(item) : '#4B2E25';
        const label = formatValue ? formatValue(val) : String(val);
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#444', marginBottom: '5px' }}>
              <span>{item[labelKey]}</span>
              <span style={{ color }}>{label}</span>
            </div>
            <div style={{ background: '#F5EFE7', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.6s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({ data }: { data: { month: string; revenue: number; bookings: number }[] }) {
  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  const maxBook = Math.max(...data.map(d => d.bookings), 1);
  const CHART_H = 120;

  const revenuePoints = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.revenue / maxRev) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div>
      <div style={{ position: 'relative', height: `${CHART_H}px`, marginBottom: '8px' }}>
        <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4B2E25" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4B2E25" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,100 ${revenuePoints} 100,100`}
            fill="url(#revGrad)"
          />
          <polyline
            points={revenuePoints}
            fill="none"
            stroke="#4B2E25"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (d.revenue / maxRev) * 100;
            return (
              <circle key={i} cx={x} cy={y} r="2.5" fill="#4B2E25" vectorEffect="non-scaling-stroke">
                <title>{d.month}: {fmt(d.revenue)}</title>
              </circle>
            );
          })}
        </svg>
      </div>
      {/* X-axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {data.map((d, i) => (
          <div key={i} style={{ fontSize: '0.68rem', color: '#aaa', fontWeight: 600, textAlign: 'center', flex: 1 }}>{d.month}</div>
        ))}
      </div>
      {/* Booking dots legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: `${Math.max(6, (d.bookings / maxBook) * 22)}px`, height: `${Math.max(6, (d.bookings / maxBook) * 22)}px`, borderRadius: '50%', background: '#C9A47E', opacity: 0.8, margin: '0 auto' }} />
            <span style={{ fontSize: '0.65rem', color: '#bbb' }}>{d.bookings}b</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const revDelta  = delta(data.revenueThisMonth, data.revenueLastMonth);
  const bookDelta = delta(data.bookingsThisMonth, data.bookingsLastMonth);
  const totalBoxAll = data.bySchool.reduce((s, x) => s + x.boxes, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* KPI Row */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <KpiCard label="Total Revenue" value={fmt(data.totalRevenue)} sub="all time" />
        <KpiCard label="Revenue This Month" value={fmt(data.revenueThisMonth)} deltaVal={revDelta} color="#4B2E25" />
        <KpiCard label="Total Bookings" value={String(data.totalBookings)} sub="active" />
        <KpiCard label="Bookings This Month" value={String(data.bookingsThisMonth)} deltaVal={bookDelta} />
        <KpiCard label="Avg Boxes / Booking" value={String(data.avgBoxesPerBooking)} sub={`${data.totalBoxes} total boxes`} />
      </div>

      {/* Revenue Trend + School Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>

        {/* Trend chart */}
        <div style={{ background: '#fff', border: '1px solid #E7D3BF', borderRadius: '14px', padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: '4px' }}>Revenue Trend</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4B2E25' }}>Last 6 months</div>
          </div>
          <TrendChart data={data.monthlyRevenue} />
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F0E8DE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '3px', background: '#4B2E25', borderRadius: '2px' }} />
              <span style={{ fontSize: '0.72rem', color: '#888' }}>Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#C9A47E', opacity: 0.8 }} />
              <span style={{ fontSize: '0.72rem', color: '#888' }}>Bookings (size = volume)</span>
            </div>
          </div>
        </div>

        {/* School breakdown */}
        <div style={{ background: '#fff', border: '1px solid #E7D3BF', borderRadius: '14px', padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: '4px' }}>By Campus</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4B2E25' }}>School breakdown</div>
          </div>
          {data.bySchool.length === 0 ? (
            <p style={{ color: '#ccc', fontSize: '0.85rem' }}>No data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {data.bySchool.map(s => {
                const color = SCHOOL_COLORS[s.school] || '#888';
                const bookingPct = data.totalBookings ? Math.round((s.bookings / data.totalBookings) * 100) : 0;
                const revPct = data.totalRevenue ? Math.round((s.revenue / data.totalRevenue) * 100) : 0;
                return (
                  <div key={s.school}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#333' }}>
                          {s.school === 'Stonehill College' ? 'Stonehill' : s.school === 'University of New Haven' ? 'UNH' : s.school}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{bookingPct}%</span>
                    </div>
                    <div style={{ background: '#F5EFE7', borderRadius: '6px', height: '8px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{ width: `${bookingPct}%`, height: '100%', background: color, borderRadius: '6px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.72rem', color: '#aaa' }}>
                      <span>{s.bookings} booking{s.bookings !== 1 ? 's' : ''}</span>
                      <span>{fmt(s.revenue)} revenue</span>
                      <span>{s.boxes} boxes</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status + Box Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Booking status */}
        <div style={{ background: '#fff', border: '1px solid #E7D3BF', borderRadius: '14px', padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: '4px' }}>Booking Status</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4B2E25' }}>Status breakdown</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.byStatus.map(s => {
              const meta = STATUS_META[s.status] || { label: s.status, color: '#666', bg: '#eee' };
              const pct = data.totalBookings ? Math.round((s.count / data.totalBookings) * 100) : 0;
              return (
                <div key={s.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, background: meta.bg, color: meta.color, padding: '2px 8px', borderRadius: '20px' }}>{meta.label}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555' }}>{s.count} <span style={{ color: '#bbb', fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ background: '#F5EFE7', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: '6px', opacity: 0.8 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Box distribution */}
        <div style={{ background: '#fff', border: '1px solid #E7D3BF', borderRadius: '14px', padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: '4px' }}>Box Volume</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4B2E25' }}>Boxes per booking</div>
          </div>
          <BarChart
            data={data.boxDistribution}
            valueKey="count"
            labelKey="range"
            colorFn={() => '#C9A47E'}
            formatValue={v => `${v} booking${v !== 1 ? 's' : ''}`}
          />
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F0E8DE', display: 'flex', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Boxes</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4B2E25' }}>{data.totalBoxes}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg / Booking</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4B2E25' }}>{data.avgBoxesPerBooking}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
