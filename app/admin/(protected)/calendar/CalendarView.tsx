'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookingWithCustomer } from '@/lib/admin/actions';
import { formatDate, formatTime } from '@/lib/utils/date';

const SCHOOLS = ['All Schools', 'Stonehill College', 'University of New Haven'];

const BOX_RANGES = [
  { label: 'All Boxes', min: 0, max: Infinity },
  { label: '1–5 boxes', min: 1, max: 5 },
  { label: '6–10 boxes', min: 6, max: 10 },
  { label: '11–15 boxes', min: 11, max: 15 },
  { label: '16+ boxes', min: 16, max: Infinity },
];

const SCHOOL_COLORS: Record<string, { bg: string; text: string; dot: string; light: string }> = {
  'Stonehill College':       { bg: '#4B2E25', text: '#fff', dot: '#C9A47E', light: '#F5EDE8' },
  'University of New Haven': { bg: '#1B4F72', text: '#fff', dot: '#7FB3D3', light: '#E8F1F8' },
};
const FALLBACK_COLOR = { bg: '#5A5A5A', text: '#fff', dot: '#ccc', light: '#f0f0f0' };

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed:       { label: 'Confirmed', color: '#1A7F4B' },
  pending:         { label: 'Pending',   color: '#B45309' },
  pending_payment: { label: 'Unpaid',    color: '#B45309' },
  cancelled:       { label: 'Cancelled', color: '#991B1B' },
};

function formatTime(s: string) {
  if (!s) return '';
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  const h = parseInt(m[1], 10);
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekStart(d: Date) {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ─── Day Detail Modal (month view click) ────────────────────────────────────

type DayDetailProps = {
  date: string;
  bookings: BookingWithCustomer[];
  onClose: () => void;
  schoolFilter: string;
  boxFilter: string;
};

function DayDetailPanel({ date, bookings, onClose, schoolFilter, boxFilter }: DayDetailProps) {
  const selectedBoxRange = BOX_RANGES.find(r => r.label === boxFilter) || BOX_RANGES[0];
  const matchesFilter = (b: BookingWithCustomer) =>
    (schoolFilter === 'All Schools' || b.school === schoolFilter) &&
    b.box_quantity >= selectedBoxRange.min && b.box_quantity <= selectedBoxRange.max;

  const sorted = [...bookings].sort((a, b) => (a.move_out_time_slot || '').localeCompare(b.move_out_time_slot || ''));
  const dateFmt = formatDate(date);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '520px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: '4px' }}>Move-out day</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4B2E25', margin: 0 }}>{dateFmt}</h3>
            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: '#aaa', lineHeight: 1, padding: '4px' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sorted.map(b => {
            const matches = matchesFilter(b);
            const color = SCHOOL_COLORS[b.school] || FALLBACK_COLOR;
            const statusInfo = STATUS_LABELS[b.status] || { label: b.status, color: '#666' };
            const isFiltered = schoolFilter !== 'All Schools' || boxFilter !== 'All Boxes';
            return (
              <div key={b.id} style={{ border: '1px solid #E7D3BF', borderRadius: '10px', padding: '14px 16px', opacity: isFiltered && !matches ? 0.35 : 1, filter: isFiltered && !matches ? 'grayscale(1)' : 'none', transition: 'opacity 0.2s, filter 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color.bg, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a' }}>{b.customer?.full_name || 'Unknown Student'}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: statusInfo.color + '18', color: statusInfo.color, padding: '2px 8px', borderRadius: '20px' }}>{statusInfo.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: '0.8rem', color: '#666' }}>
                  <span>🏫 {b.school}</span>
                  <span>🕐 {formatTime(b.move_out_time_slot) || '—'}</span>
                  <span>🏠 {b.dorm || '—'}</span>
                  <span>📦 {b.box_quantity} box{b.box_quantity !== 1 ? 'es' : ''}</span>
                  {b.customer?.email && <span style={{ gridColumn: '1 / -1' }}>✉️ {b.customer.email}</span>}
                  {b.customer?.phone && <span>📞 {b.customer.phone}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({ weekStart, bookingsByDate, matchesFilter, isFiltered, today }: {
  weekStart: Date;
  bookingsByDate: Record<string, BookingWithCustomer[]>;
  matchesFilter: (b: BookingWithCustomer) => boolean;
  isFiltered: boolean;
  today: Date;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStr = toDateStr(today);

  return (
    <div style={{ border: '1px solid #E7D3BF', borderRadius: '14px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
      {/* Day header row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid #E7D3BF', background: '#F7F3EE' }}>
        {days.map((d, i) => {
          const ds = toDateStr(d);
          const isToday = ds === todayStr;
          const count = (bookingsByDate[ds] || []).length;
          return (
            <div key={i} style={{ padding: '14px 12px', textAlign: 'center', borderRight: i < 6 ? '1px solid #E7D3BF' : 'none' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '6px' }}>{DAYS[d.getDay()]}</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '34px', height: '34px', borderRadius: '50%',
                fontSize: '1rem', fontWeight: 700,
                background: isToday ? '#4B2E25' : 'transparent',
                color: isToday ? '#fff' : '#1a1a1a',
                margin: '0 auto',
              }}>
                {d.getDate()}
              </div>
              {count > 0 && (
                <div style={{ marginTop: '5px', fontSize: '0.7rem', fontWeight: 600, color: '#4B2E25' }}>
                  {count} booking{count !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable day columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', alignItems: 'stretch' }}>
        {days.map((d, i) => {
          const ds = toDateStr(d);
          const isToday = ds === todayStr;
          const dayBookings = (bookingsByDate[ds] || []).sort((a, b) =>
            (a.move_out_time_slot || '').localeCompare(b.move_out_time_slot || '')
          );

          return (
            <div key={i} style={{
              borderRight: i < 6 ? '1px solid #E7D3BF' : 'none',
              background: isToday ? 'rgba(201, 164, 126, 0.07)' : '#fff',
              height: '580px',
              overflowY: 'auto',
              padding: '10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {dayBookings.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#ccc', userSelect: 'none' }}>—</span>
                </div>
              ) : (
                dayBookings.map(b => {
                  const matches = matchesFilter(b);
                  const color = SCHOOL_COLORS[b.school] || FALLBACK_COLOR;
                  const statusInfo = STATUS_LABELS[b.status] || { label: b.status, color: '#666' };
                  return (
                    <div key={b.id} style={{
                      background: color.light,
                      borderLeft: `3px solid ${color.bg}`,
                      borderRadius: '7px',
                      padding: '10px 10px',
                      transition: 'opacity 0.2s, filter 0.2s',
                      opacity: isFiltered && !matches ? 0.15 : 1,
                      filter: isFiltered && !matches ? 'grayscale(1)' : 'none',
                      flexShrink: 0,
                    }}>
                      {/* Time */}
                      {formatTime(b.move_out_time_slot) && (
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: color.bg, marginBottom: '4px', letterSpacing: '0.03em' }}>
                          {formatTime(b.move_out_time_slot)}
                        </div>
                      )}
                      {/* Name */}
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px', lineHeight: 1.3 }}>
                        {b.customer?.full_name || 'Unknown Student'}
                      </div>
                      {/* School pill */}
                      <div style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 700, background: color.bg, color: '#fff', padding: '1px 7px', borderRadius: '20px', marginBottom: '6px' }}>
                        {b.school === 'Stonehill College' ? 'Stonehill' : b.school === 'University of New Haven' ? 'UNH' : b.school}
                      </div>
                      {/* Details */}
                      <div style={{ fontSize: '0.72rem', color: '#555', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {b.dorm && <span>🏠 {b.dorm}</span>}
                        <span>📦 {b.box_quantity} box{b.box_quantity !== 1 ? 'es' : ''}</span>
                      </div>
                      {/* Status */}
                      <div style={{ marginTop: '6px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, background: statusInfo.color + '18', color: statusInfo.color, padding: '1px 7px', borderRadius: '20px' }}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main CalendarView ────────────────────────────────────────────────────────

export function CalendarView({ bookings }: { bookings: BookingWithCustomer[] }) {
  const today = new Date();
  const [view, setView]               = useState<'month' | 'week'>('month');
  const [year, setYear]               = useState(today.getFullYear());
  const [month, setMonth]             = useState(today.getMonth());
  const [weekStart, setWeekStart]     = useState(() => getWeekStart(today));
  const [schoolFilter, setSchoolFilter] = useState('All Schools');
  const [boxFilter, setBoxFilter]     = useState('All Boxes');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Month nav
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Week nav
  const prevWeek = () => setWeekStart(w => addDays(w, -7));
  const nextWeek = () => setWeekStart(w => addDays(w, 7));

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setWeekStart(getWeekStart(today));
  };

  const switchToWeek = () => {
    setWeekStart(getWeekStart(today));
    setView('week');
  };

  const isFiltered = schoolFilter !== 'All Schools' || boxFilter !== 'All Boxes';
  const selectedBoxRange = BOX_RANGES.find(r => r.label === boxFilter) || BOX_RANGES[0];

  const matchesFilter = (b: BookingWithCustomer) =>
    (schoolFilter === 'All Schools' || b.school === schoolFilter) &&
    b.box_quantity >= selectedBoxRange.min &&
    b.box_quantity <= selectedBoxRange.max;

  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingWithCustomer[]> = {};
    bookings.forEach(b => {
      if (!b.move_out_date) return;
      const key = b.move_out_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [bookings]);

  // Stats
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const thisMonthBookings = useMemo(() => bookings.filter(b => b.move_out_date?.startsWith(monthKey)), [bookings, monthKey]);
  const filteredThisMonth = thisMonthBookings.filter(matchesFilter);

  // Month grid
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDay + 1;
    const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dateStr = isCurrentMonth ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : null;
    const dayBookings = dateStr ? (bookingsByDate[dateStr] || []) : [];
    const isToday = isCurrentMonth && year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate();
    return { dayNum, isCurrentMonth, dateStr, dayBookings, isToday };
  });

  // Week header label
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${MONTHS_SHORT[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
    : `${MONTHS_SHORT[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS_SHORT[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;

  const selectedBookings = selectedDate ? (bookingsByDate[selectedDate] || []) : [];

  return (
    <>
      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[
          { label: 'Move-outs this month', value: isFiltered ? filteredThisMonth.length : thisMonthBookings.length },
          { label: 'Stonehill', value: thisMonthBookings.filter(b => b.school === 'Stonehill College' && (schoolFilter === 'All Schools' || schoolFilter === 'Stonehill College')).length, color: SCHOOL_COLORS['Stonehill College'].bg },
          { label: 'Univ. of New Haven', value: thisMonthBookings.filter(b => b.school === 'University of New Haven' && (schoolFilter === 'All Schools' || schoolFilter === 'University of New Haven')).length, color: SCHOOL_COLORS['University of New Haven'].bg },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#fff', border: '1px solid #E7D3BF', borderRadius: '12px', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {stat.color && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: stat.color, flexShrink: 0 }} />}
              <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>{stat.label}</span>
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4B2E25', lineHeight: 1.1 }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>

        {/* Left: nav + view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={view === 'month' ? prevMonth : prevWeek} style={NAV_BTN_STYLE}>
            <ChevronLeft size={22} strokeWidth={2.5} color="#4B2E25" />
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4B2E25', minWidth: '220px', textAlign: 'center', margin: 0 }}>
            {view === 'month' ? `${MONTHS[month]} ${year}` : weekLabel}
          </h2>
          <button onClick={view === 'month' ? nextMonth : nextWeek} style={NAV_BTN_STYLE}>
            <ChevronRight size={22} strokeWidth={2.5} color="#4B2E25" />
          </button>

          <button onClick={goToday} style={TODAY_BTN_STYLE}>Today</button>

          {/* View toggle */}
          <div style={{ display: 'flex', background: '#F7F3EE', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {(['month', 'week'] as const).map(v => (
              <button
                key={v}
                onClick={() => v === 'week' ? switchToWeek() : setView('month')}
                style={{
                  padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontSize: '0.82rem', fontWeight: 600,
                  background: view === v ? '#4B2E25' : 'transparent',
                  color: view === v ? '#fff' : '#4B2E25',
                  transition: 'all 0.15s',
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Right: filters */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} style={SELECT_STYLE}>
            {SCHOOLS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={boxFilter} onChange={e => setBoxFilter(e.target.value)} style={SELECT_STYLE}>
            {BOX_RANGES.map(r => <option key={r.label}>{r.label}</option>)}
          </select>
          {isFiltered && (
            <button onClick={() => { setSchoolFilter('All Schools'); setBoxFilter('All Boxes'); }} style={CLEAR_BTN_STYLE}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Calendar */}
      {view === 'month' ? (
        <div style={{ border: '1px solid #E7D3BF', borderRadius: '14px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid #E7D3BF' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '14px 0', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', background: '#F7F3EE' }}>
                {d}
              </div>
            ))}
          </div>
          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((cell, i) => {
              const isLastRow = i >= cells.length - 7;
              const isLastCol = i % 7 === 6;
              const visibleBookings = cell.dayBookings.slice(0, 3);
              const overflow = cell.dayBookings.length - 3;
              return (
                <div key={i}
                  onClick={() => cell.isCurrentMonth && cell.dayBookings.length > 0 && setSelectedDate(cell.dateStr)}
                  style={{
                    minHeight: '130px', padding: '10px 8px 8px',
                    borderRight: isLastCol ? 'none' : '1px solid #E7D3BF',
                    borderBottom: isLastRow ? 'none' : '1px solid #E7D3BF',
                    background: cell.isToday ? 'rgba(201,164,126,0.1)' : cell.isCurrentMonth ? '#fff' : '#fafafa',
                    cursor: cell.isCurrentMonth && cell.dayBookings.length > 0 ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (cell.isCurrentMonth && cell.dayBookings.length > 0) (e.currentTarget as HTMLElement).style.background = '#F7F3EE'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = cell.isToday ? 'rgba(201,164,126,0.1)' : cell.isCurrentMonth ? '#fff' : '#fafafa'; }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', fontSize: '0.82rem', fontWeight: cell.isToday ? 700 : 400, color: cell.isToday ? '#fff' : cell.isCurrentMonth ? '#1a1a1a' : '#ccc', background: cell.isToday ? '#4B2E25' : 'transparent', marginBottom: '5px' }}>
                    {cell.isCurrentMonth ? cell.dayNum : ''}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {visibleBookings.map(b => {
                      const matches = matchesFilter(b);
                      const color = SCHOOL_COLORS[b.school] || FALLBACK_COLOR;
                      return (
                        <div key={b.id} title={`${b.customer?.full_name || 'Student'} · ${b.school} · ${b.box_quantity} boxes · ${formatTime(b.move_out_time_slot)}`} style={{ padding: '3px 7px', borderRadius: '5px', fontSize: '0.71rem', fontWeight: 600, background: color.bg, color: color.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '5px', transition: 'opacity 0.2s, filter 0.2s', opacity: isFiltered && !matches ? 0.15 : 1, filter: isFiltered && !matches ? 'grayscale(1) brightness(1.2)' : 'none' }}>
                          {formatTime(b.move_out_time_slot) && <span style={{ opacity: 0.7, fontSize: '0.65rem', flexShrink: 0 }}>{formatTime(b.move_out_time_slot)}</span>}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{b.customer?.full_name?.split(' ')[0] || 'Student'}</span>
                          <span style={{ opacity: 0.75, fontSize: '0.65rem', flexShrink: 0 }}>{b.box_quantity}b</span>
                        </div>
                      );
                    })}
                    {overflow > 0 && <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4B2E25', paddingLeft: '4px', opacity: 0.8 }}>+{overflow} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <WeekView weekStart={weekStart} bookingsByDate={bookingsByDate} matchesFilter={matchesFilter} isFiltered={isFiltered} today={today} />
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        {Object.entries(SCHOOL_COLORS).map(([school, color]) => (
          <div key={school} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color.bg, flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#666' }}>{school}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#aaa' }}>
          {view === 'month' ? 'Click any day to view details' : 'Each column scrolls independently'}
        </div>
      </div>

      {/* Day detail modal (month view) */}
      {selectedDate && selectedBookings.length > 0 && (
        <DayDetailPanel date={selectedDate} bookings={selectedBookings} onClose={() => setSelectedDate(null)} schoolFilter={schoolFilter} boxFilter={boxFilter} />
      )}
    </>
  );
}

const NAV_BTN_STYLE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '4px', border: 'none', background: 'none',
  cursor: 'pointer', flexShrink: 0, lineHeight: 1,
};

const TODAY_BTN_STYLE: React.CSSProperties = {
  padding: '6px 16px', borderRadius: '20px',
  border: '1.5px solid #C9A47E', background: '#fff',
  color: '#4B2E25', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
};

const SELECT_STYLE: React.CSSProperties = {
  padding: '8px 14px', borderRadius: '8px',
  border: '1px solid #E7D3BF', background: '#fff',
  color: '#4B2E25', fontSize: '0.85rem', cursor: 'pointer',
  outline: 'none', fontFamily: 'inherit',
};

const CLEAR_BTN_STYLE: React.CSSProperties = {
  padding: '7px 14px', borderRadius: '8px',
  border: '1px solid #C9A47E', background: '#E7D3BF',
  color: '#4B2E25', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
};
