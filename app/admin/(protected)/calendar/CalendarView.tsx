'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookingWithCustomer } from '@/lib/admin/actions';
import { formatDate } from '@/lib/utils/date';
import { SCHOOL_NAMES } from '@/lib/schools/config';

const SCHOOLS = ['All Schools', ...SCHOOL_NAMES];

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

// Distinct color for move-in delivery events
const MOVE_IN_COLOR = { bg: '#1A7F4B', text: '#fff', light: '#E6F4EE' };

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
  moveOutBookings: BookingWithCustomer[];
  moveInBookings: BookingWithCustomer[];
  onClose: () => void;
  schoolFilter: string;
  boxFilter: string;
};

function DayDetailPanel({ date, moveOutBookings, moveInBookings, onClose, schoolFilter, boxFilter }: DayDetailProps) {
  const selectedBoxRange = BOX_RANGES.find(r => r.label === boxFilter) || BOX_RANGES[0];
  const matchesFilter = (b: BookingWithCustomer) =>
    (schoolFilter === 'All Schools' || b.school === schoolFilter) &&
    b.box_quantity >= selectedBoxRange.min && b.box_quantity <= selectedBoxRange.max;
  const isFiltered = schoolFilter !== 'All Schools' || boxFilter !== 'All Boxes';

  const sortedOut = [...moveOutBookings].sort((a, b) => (a.move_out_time_slot || '').localeCompare(b.move_out_time_slot || ''));
  const sortedIn  = [...moveInBookings].sort((a, b) => (a.move_in_time_slot || '').localeCompare(b.move_in_time_slot || ''));
  const dateFmt = formatDate(date);
  const total = moveOutBookings.length + moveInBookings.length;

  const BookingCard = ({ b, type }: { b: BookingWithCustomer; type: 'move-out' | 'move-in' }) => {
    const matches = matchesFilter(b);
    const color = type === 'move-in' ? MOVE_IN_COLOR : (SCHOOL_COLORS[b.school] || FALLBACK_COLOR);
    const statusInfo = STATUS_LABELS[b.status] || { label: b.status, color: '#666' };
    const timeSlot = type === 'move-in' ? b.move_in_time_slot : b.move_out_time_slot;
    const dorm = type === 'move-in' ? (b.move_in_dorm || b.dorm) : b.dorm;
    const room = type === 'move-in' ? b.move_in_room : b.room;
    return (
      <div style={{ border: `1px solid ${type === 'move-in' ? '#B2DEC9' : '#E7D3BF'}`, borderRadius: '10px', padding: '14px 16px', opacity: isFiltered && !matches ? 0.35 : 1, filter: isFiltered && !matches ? 'grayscale(1)' : 'none', transition: 'opacity 0.2s, filter 0.2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color.bg, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a' }}>{b.customer?.full_name || 'Unknown Student'}</span>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, background: statusInfo.color + '18', color: statusInfo.color, padding: '2px 8px', borderRadius: '20px' }}>{statusInfo.label}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: '0.8rem', color: '#666' }}>
          <span>🏫 {b.school}</span>
          <span>🕐 {formatTime(timeSlot || '') || '—'}</span>
          <span>🏠 {dorm || '—'}{room ? ` · Room ${room}` : ''}</span>
          <span>📦 {b.box_quantity} box{b.box_quantity !== 1 ? 'es' : ''}</span>
          {b.customer?.email && <span style={{ gridColumn: '1 / -1' }}>✉️ {b.customer.email}</span>}
          {b.customer?.phone && <span>📞 {b.customer.phone}</span>}
          {type === 'move-in' && b.move_in_confirmed_at && (
            <span style={{ gridColumn: '1 / -1', color: MOVE_IN_COLOR.bg, fontWeight: 600 }}>✅ Delivery confirmed</span>
          )}
          {type === 'move-in' && !b.move_in_confirmed_at && (
            <span style={{ gridColumn: '1 / -1', color: '#B45309', fontWeight: 600 }}>⚠️ Dorm not confirmed</span>
          )}
          {b.special_instructions && (
            <span style={{ gridColumn: '1 / -1', fontStyle: 'italic' }}>📝 {b.special_instructions}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '540px', maxWidth: '90vw', maxHeight: '82vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4B2E25', margin: 0 }}>{dateFmt}</h3>
            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>{total} event{total !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: '#aaa', lineHeight: 1, padding: '4px' }}>×</button>
        </div>

        {sortedOut.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4B2E25', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4B2E25', display: 'inline-block' }} />
              Move-out ({sortedOut.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedOut.map(b => <BookingCard key={b.id} b={b} type="move-out" />)}
            </div>
          </div>
        )}

        {sortedIn.length > 0 && (
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: MOVE_IN_COLOR.bg, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: MOVE_IN_COLOR.bg, display: 'inline-block' }} />
              Move-in / Delivery ({sortedIn.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedIn.map(b => <BookingCard key={b.id + '-in'} b={b} type="move-in" />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({ weekStart, bookingsByDate, moveInByDate, matchesFilter, isFiltered, today }: {
  weekStart: Date;
  bookingsByDate: Record<string, BookingWithCustomer[]>;
  moveInByDate: Record<string, BookingWithCustomer[]>;
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
          const outCount = (bookingsByDate[ds] || []).length;
          const inCount = (moveInByDate[ds] || []).length;
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
              {outCount > 0 && (
                <div style={{ marginTop: '4px', fontSize: '0.68rem', fontWeight: 600, color: '#4B2E25' }}>
                  {outCount} out
                </div>
              )}
              {inCount > 0 && (
                <div style={{ marginTop: '2px', fontSize: '0.68rem', fontWeight: 600, color: MOVE_IN_COLOR.bg }}>
                  {inCount} in
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
          const moveOutEvents = (bookingsByDate[ds] || []).sort((a, b) =>
            (a.move_out_time_slot || '').localeCompare(b.move_out_time_slot || '')
          );
          const moveInEvents = (moveInByDate[ds] || []).sort((a, b) =>
            (a.move_in_time_slot || '').localeCompare(b.move_in_time_slot || '')
          );
          const hasEvents = moveOutEvents.length > 0 || moveInEvents.length > 0;

          const EventCard = ({ b, type }: { b: BookingWithCustomer; type: 'move-out' | 'move-in' }) => {
            const matches = matchesFilter(b);
            const color = type === 'move-in' ? MOVE_IN_COLOR : (SCHOOL_COLORS[b.school] || FALLBACK_COLOR);
            const statusInfo = STATUS_LABELS[b.status] || { label: b.status, color: '#666' };
            const timeSlot = type === 'move-in' ? b.move_in_time_slot : b.move_out_time_slot;
            const dorm = type === 'move-in' ? (b.move_in_dorm || b.dorm) : b.dorm;
            return (
              <div style={{
                background: color.light,
                borderLeft: `3px solid ${color.bg}`,
                borderRadius: '7px',
                padding: '10px',
                transition: 'opacity 0.2s, filter 0.2s',
                opacity: isFiltered && !matches ? 0.15 : 1,
                filter: isFiltered && !matches ? 'grayscale(1)' : 'none',
                flexShrink: 0,
              }}>
                {type === 'move-in' && (
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: color.bg, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                    📦 Move-in
                  </div>
                )}
                {formatTime(timeSlot || '') && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: color.bg, marginBottom: '4px', letterSpacing: '0.03em' }}>
                    {formatTime(timeSlot || '')}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px', lineHeight: 1.3 }}>
                  {b.customer?.full_name || 'Unknown Student'}
                </div>
                <div style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 700, background: type === 'move-in' ? color.bg : (SCHOOL_COLORS[b.school] || FALLBACK_COLOR).bg, color: '#fff', padding: '1px 7px', borderRadius: '20px', marginBottom: '6px' }}>
                  {b.school === 'Stonehill College' ? 'Stonehill' : b.school === 'University of New Haven' ? 'UNH' : b.school}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#555', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {dorm && <span>🏠 {dorm}</span>}
                  <span>📦 {b.box_quantity} box{b.box_quantity !== 1 ? 'es' : ''}</span>
                </div>
                <div style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, background: statusInfo.color + '18', color: statusInfo.color, padding: '1px 7px', borderRadius: '20px' }}>
                    {statusInfo.label}
                  </span>
                  {type === 'move-in' && !b.move_in_confirmed_at && (
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, background: '#FEF3C718', color: '#B45309', padding: '1px 7px', borderRadius: '20px', marginLeft: '4px' }}>
                      Unconfirmed
                    </span>
                  )}
                </div>
              </div>
            );
          };

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
              {!hasEvents ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#ccc', userSelect: 'none' }}>—</span>
                </div>
              ) : (
                <>
                  {moveOutEvents.map(b => <EventCard key={b.id} b={b} type="move-out" />)}
                  {moveInEvents.map(b => <EventCard key={b.id + '-in'} b={b} type="move-in" />)}
                </>
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
    // Start the week view on the first week of whichever month is currently visible
    setWeekStart(getWeekStart(new Date(year, month, 1)));
    setView('week');
  };

  const switchToMonth = () => {
    // When going back to month view, sync month/year to wherever the week view currently is
    setYear(weekStart.getFullYear());
    setMonth(weekStart.getMonth());
    setView('month');
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

  const moveInByDate = useMemo(() => {
    const map: Record<string, BookingWithCustomer[]> = {};
    bookings.forEach(b => {
      if (!b.move_in_date) return;
      const key = b.move_in_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [bookings]);

  // Stats
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const thisMonthBookings = useMemo(() => bookings.filter(b => b.move_out_date?.startsWith(monthKey)), [bookings, monthKey]);
  const thisMonthMoveIns  = useMemo(() => bookings.filter(b => b.move_in_date?.startsWith(monthKey) && b.status !== 'cancelled'), [bookings, monthKey]);
  const filteredThisMonth = thisMonthBookings.filter(matchesFilter);

  // Month grid
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDay + 1;
    const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dateStr = isCurrentMonth ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : null;
    const dayMoveOut = dateStr ? (bookingsByDate[dateStr] || []) : [];
    const dayMoveIn  = dateStr ? (moveInByDate[dateStr] || []) : [];
    const isToday = isCurrentMonth && year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate();
    return { dayNum, isCurrentMonth, dateStr, dayMoveOut, dayMoveIn, isToday };
  });

  // Week header label
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${MONTHS_SHORT[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
    : `${MONTHS_SHORT[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS_SHORT[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;

  const selectedMoveOut = selectedDate ? (bookingsByDate[selectedDate] || []) : [];
  const selectedMoveIn  = selectedDate ? (moveInByDate[selectedDate] || []) : [];

  return (
    <>
      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[
          { label: 'Move-outs this month', value: isFiltered ? filteredThisMonth.length : thisMonthBookings.length },
          { label: 'Move-ins this month', value: thisMonthMoveIns.length, color: MOVE_IN_COLOR.bg },
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
                onClick={() => v === 'week' ? switchToWeek() : switchToMonth()}
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
              // Show up to 3 total events, move-outs first, then move-ins
              const allEvents = [
                ...cell.dayMoveOut.map(b => ({ b, type: 'move-out' as const })),
                ...cell.dayMoveIn.map(b => ({ b, type: 'move-in' as const })),
              ];
              const visibleEvents = allEvents.slice(0, 3);
              const overflow = allEvents.length - 3;
              const hasAny = allEvents.length > 0;
              return (
                <div key={i}
                  onClick={() => cell.isCurrentMonth && hasAny && setSelectedDate(cell.dateStr)}
                  style={{
                    minHeight: '130px', padding: '10px 8px 8px',
                    borderRight: isLastCol ? 'none' : '1px solid #E7D3BF',
                    borderBottom: isLastRow ? 'none' : '1px solid #E7D3BF',
                    background: cell.isToday ? 'rgba(201,164,126,0.1)' : cell.isCurrentMonth ? '#fff' : '#fafafa',
                    cursor: cell.isCurrentMonth && hasAny ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (cell.isCurrentMonth && hasAny) (e.currentTarget as HTMLElement).style.background = '#F7F3EE'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = cell.isToday ? 'rgba(201,164,126,0.1)' : cell.isCurrentMonth ? '#fff' : '#fafafa'; }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', fontSize: '0.82rem', fontWeight: cell.isToday ? 700 : 400, color: cell.isToday ? '#fff' : cell.isCurrentMonth ? '#1a1a1a' : '#ccc', background: cell.isToday ? '#4B2E25' : 'transparent', marginBottom: '5px' }}>
                    {cell.isCurrentMonth ? cell.dayNum : ''}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {visibleEvents.map(({ b, type }) => {
                      const matches = matchesFilter(b);
                      const color = type === 'move-in' ? MOVE_IN_COLOR : (SCHOOL_COLORS[b.school] || FALLBACK_COLOR);
                      const timeSlot = type === 'move-in' ? b.move_in_time_slot : b.move_out_time_slot;
                      return (
                        <div key={b.id + '-' + type} title={`${type === 'move-in' ? '📦 Move-in' : '📤 Move-out'} · ${b.customer?.full_name || 'Student'} · ${b.school} · ${b.box_quantity} boxes`} style={{ padding: '3px 7px', borderRadius: '5px', fontSize: '0.71rem', fontWeight: 600, background: color.bg, color: color.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '5px', transition: 'opacity 0.2s, filter 0.2s', opacity: isFiltered && !matches ? 0.15 : 1, filter: isFiltered && !matches ? 'grayscale(1) brightness(1.2)' : 'none' }}>
                          {type === 'move-in' && <span style={{ opacity: 0.85, fontSize: '0.6rem', flexShrink: 0 }}>IN</span>}
                          {formatTime(timeSlot || '') && <span style={{ opacity: 0.7, fontSize: '0.65rem', flexShrink: 0 }}>{formatTime(timeSlot || '')}</span>}
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
        <WeekView weekStart={weekStart} bookingsByDate={bookingsByDate} moveInByDate={moveInByDate} matchesFilter={matchesFilter} isFiltered={isFiltered} today={today} />
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        {Object.entries(SCHOOL_COLORS).map(([school, color]) => (
          <div key={school} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color.bg, flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#666' }}>{school}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: MOVE_IN_COLOR.bg, flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: '#666' }}>Move-in delivery</span>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#aaa' }}>
          {view === 'month' ? 'Click any day to view details' : 'Each column scrolls independently'}
        </div>
      </div>

      {/* Day detail modal (month view) */}
      {selectedDate && (selectedMoveOut.length > 0 || selectedMoveIn.length > 0) && (
        <DayDetailPanel date={selectedDate} moveOutBookings={selectedMoveOut} moveInBookings={selectedMoveIn} onClose={() => setSelectedDate(null)} schoolFilter={schoolFilter} boxFilter={boxFilter} />
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
