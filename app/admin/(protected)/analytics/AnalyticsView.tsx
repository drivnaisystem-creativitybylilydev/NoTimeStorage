'use client';

import { useState } from 'react';
import type { AnalyticsData } from '@/lib/admin/actions';
import { SCHOOLS } from '@/lib/schools/config';

const SCHOOL_PALETTE = [
  '#4B2E25', '#1B4F72', '#7C4A30', '#2D5A3D', '#5C4033', '#3D5A80',
  '#8B6914', '#4A6B6B', '#6B4423', '#2C5282', '#744210', '#1A365D',
];
function schoolColor(school: string, index: number): string {
  return SCHOOL_PALETTE[index % SCHOOL_PALETTE.length];
}

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
function fmtTooltip(n: number) {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
    <div className="admin-analytics-kpi" style={{ background: '#fff', border: '1px solid #E7D3BF', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
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
            <div className="admin-analytics-bar-row">
              <span className="admin-analytics-bar-label">{item[labelKey]}</span>
              <span className="admin-analytics-bar-value" style={{ color }}>{label}</span>
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

function smoothCurve(pts: { x: number; y: number }[], maxY: number): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const pp   = pts[Math.max(0, i - 2)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    let cp1x = prev.x + (curr.x - pp.x) / 6;
    let cp1y = prev.y + (curr.y - pp.y) / 6;
    let cp2x = curr.x - (next.x - prev.x) / 6;
    let cp2y = curr.y - (next.y - prev.y) / 6;
    cp1y = Math.min(cp1y, maxY);
    cp2y = Math.min(cp2y, maxY);
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
  }
  return d;
}

type MonthlyRow = { month: string; revenue: number; bookings: number; schoolData: Record<string, { revenue: number; bookings: number }> };

function TrendChart({ data, filterSchool, onFilterSchool }: { data: MonthlyRow[]; filterSchool: string | null; onFilterSchool: (school: string | null) => void }) {
  const allSchools = [...SCHOOLS.map(s => s.name)];
  const hasOther = data.some(d => 'Other' in (d.schoolData || {}));
  if (hasOther) allSchools.push('Other');

  const W = 600, H = 320;
  const PAD = { top: 24, right: 24, bottom: 40, left: 56 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const maxRev = Math.max(
    1,
    ...data.flatMap(d => Object.values(d.schoolData || {}).map(v => v.revenue))
  );
  const gridMax = Math.ceil(maxRev / 100) * 100 || 100;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => ({ val: gridMax * f, y: PAD.top + cH - f * cH }));
  const baselineY = PAD.top + cH;

  const schoolLines = allSchools.map((school, schoolIdx) => {
    const pts = data.map((d, i) => {
      const sd = d.schoolData?.[school] ?? { revenue: 0, bookings: 0 };
      return {
        x: PAD.left + (data.length === 1 ? cW / 2 : (i / Math.max(1, data.length - 1)) * cW),
        y: PAD.top + cH - (sd.revenue / gridMax) * cH,
        month: d.month,
        revenue: sd.revenue,
        bookings: sd.bookings,
      };
    });
    const path = smoothCurve(pts, baselineY);
    return { school, pts, path, color: schoolColor(school, schoolIdx) };
  });

  return (
    <div className="admin-analytics-trend-wrap" style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="admin-analytics-trend-chart-box" style={{ width: '100%', flex: 1, minHeight: 180 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="admin-analytics-trend-svg"
          style={{ width: '100%', height: '100%', minHeight: 180, display: 'block' }}
          role="img"
          aria-label="Revenue trend chart by school"
        >
          <defs>
            <clipPath id="chartClip">
              <rect x={PAD.left} y={PAD.top} width={cW} height={cH} />
            </clipPath>
            <filter id="lineGlow" x="-10%" y="-50%" width="120%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {gridLines.map(({ val, y }) => (
            <g key={val}>
              <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y} stroke="#E7D3BF" strokeWidth="0.75" strokeDasharray={val === 0 ? undefined : '4 4'} />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#bbb" fontFamily="inherit" fontWeight={600}>
                {val === 0 ? '$0' : `$${(val / 1000).toFixed(val >= 1000 ? 1 : 0)}${val >= 1000 ? 'k' : ''}`}
              </text>
            </g>
          ))}

          <g clipPath="url(#chartClip)">
            {schoolLines.map(({ school, path, pts, color }) => {
              const isHighlighted = filterSchool === null || filterSchool === school;
              const opacity = isHighlighted ? 1 : 0.4;
              const showGlow = filterSchool === school;
              return (
                <g key={school}>
                  {showGlow && path && (
                    <path d={path} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" filter="url(#lineGlow)" />
                  )}
                  {path && (
                    <path
                      d={path}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={opacity}
                    />
                  )}
                  {pts.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="1.5" opacity={opacity} />
                      <title>{`${school} · ${p.month}: ${fmtTooltip(p.revenue)} · ${p.bookings} booking${p.bookings !== 1 ? 's' : ''}`}</title>
                    </g>
                  ))}
                </g>
              );
            })}
          </g>

          {data.map((d, i) => {
            const x = PAD.left + (data.length === 1 ? cW / 2 : (i / Math.max(1, data.length - 1)) * cW);
            return (
              <text key={i} x={x} y={PAD.top + cH + 20} textAnchor="middle" fontSize="10.5" fill="#aaa" fontFamily="inherit" fontWeight={600}>
                {d.month}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function schoolShortName(school: string): string {
  const s = SCHOOLS.find(x => x.name === school);
  return s?.shortName ?? school;
}

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const [filterSchool, setFilterSchool] = useState<string | null>(null);
  const revDelta  = delta(data.revenueThisMonth, data.revenueLastMonth);
  const bookDelta = delta(data.bookingsThisMonth, data.bookingsLastMonth);
  const totalBoxAll = data.bySchool.reduce((s, x) => s + x.boxes, 0);

  const bySchoolMap = Object.fromEntries(data.bySchool.map(s => [s.school, s]));
  const allSchools = [...new Set([...SCHOOLS.map(s => s.name), ...Object.keys(bySchoolMap)])];

  return (
    <div className="admin-analytics-page">

      {/* KPI Row */}
      <div className="admin-analytics-kpi-row">
        <KpiCard label="Total Revenue" value={fmt(data.totalRevenue)} sub="all time" />
        <KpiCard label="Revenue This Month" value={fmt(data.revenueThisMonth)} deltaVal={revDelta} color="#4B2E25" />
        <KpiCard label="Total Bookings" value={String(data.totalBookings)} sub="active" />
        <KpiCard label="Bookings This Month" value={String(data.bookingsThisMonth)} deltaVal={bookDelta} />
        <KpiCard label="Avg Boxes / Booking" value={String(data.avgBoxesPerBooking)} sub={`${data.totalBoxes} total boxes`} />
      </div>

      {/* Revenue Trend + School Breakdown */}
      <div className="admin-analytics-split">

        {/* Trend chart */}
        <div className="admin-analytics-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ marginBottom: '16px', flexShrink: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: '4px' }}>Revenue Trend</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4B2E25' }}>Last 6 months</div>
          </div>
          <div style={{ flex: 1, minHeight: 240, display: 'flex', flexDirection: 'column' }}>
            <TrendChart data={data.monthlyRevenue} filterSchool={filterSchool} onFilterSchool={setFilterSchool} />
          </div>
          <div className="admin-analytics-chart-legend">
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

        {/* School breakdown — all schools, click to filter chart */}
        <div className="admin-analytics-card">
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: '4px' }}>By Campus</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4B2E25' }}>School breakdown</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '400px', overflowY: 'auto' }}>
            {allSchools.map((school, i) => {
              const s = bySchoolMap[school] ?? { school, bookings: 0, revenue: 0, boxes: 0 };
              const color = SCHOOL_COLORS[school] ?? schoolColor(school, i);
              const bookingPct = data.totalBookings ? Math.round((s.bookings / data.totalBookings) * 100) : 0;
              const isSelected = filterSchool === school;
              return (
                <button
                  key={school}
                  type="button"
                  onClick={() => setFilterSchool(isSelected ? null : school)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px',
                    border: 'none',
                    background: isSelected ? '#F5EFE7' : 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#333' }}>
                        {schoolShortName(school)}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{bookingPct}%</span>
                  </div>
                  <div style={{ background: '#F5EFE7', borderRadius: '6px', height: '8px', overflow: 'hidden', marginBottom: '6px' }}>
                    <div style={{ width: `${bookingPct}%`, height: '100%', background: color, borderRadius: '6px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem', color: '#aaa' }}>
                    <span>{s.bookings} booking{s.bookings !== 1 ? 's' : ''}</span>
                    <span>{fmt(s.revenue)} revenue</span>
                    <span>{s.boxes} boxes</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status + Box Distribution */}
      <div className="admin-analytics-split-equal">

        {/* Booking status */}
        <div className="admin-analytics-card">
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
        <div className="admin-analytics-card">
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
          <div className="admin-analytics-metric-row" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F0E8DE' }}>
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
