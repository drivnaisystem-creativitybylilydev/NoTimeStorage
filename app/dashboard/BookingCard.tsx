'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppModal } from '@/app/components/AppModalProvider';
import { deleteBooking, updateBookingDates } from '@/lib/booking/update-booking';
import { getMoveOutWindow } from '@/lib/schools/config';

type BookingItem = { item_type: string; quantity: number; monthly_rate: number; subtotal: number };
export type BookingRow = {
  id: string;
  status: string;
  move_out_date: string;
  move_in_date: string;
  move_out_time_slot: string;
  dorm: string;
  elevator_available: boolean;
  stairs_required: boolean;
  school: string;
  total_monthly_rate: number;
  total_price: number;
  storage_months: number;
  payment_status: string;
  box_quantity: number;
  created_at: string;
  booking_items: BookingItem[] | null;
};

import { formatDateShort, formatTime as formatTimeET } from '@/lib/utils/date';
function formatDate(d: string) { return formatDateShort(d); }

function formatTimeSlot(s: string) {
  if (!s) return '—';
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const h = parseInt(match[1], 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${match[2]} ${ampm}`;
  }
  return s;
}

function generateTimeSlots() {
  const slots: { value: string; label: string }[] = [];
  for (let hour = 8; hour < 17; hour++) {
    for (let min = 0; min < 60; min += 20) {
      const value = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const label = formatTimeET(value);
      slots.push({ value, label });
    }
  }
  return slots;
}

const timeSlots = generateTimeSlots();

export function BookingCard({ booking: b }: { booking: BookingRow }) {
  const router = useRouter();
  const appModal = useAppModal();
  const [editingDates, setEditingDates] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState(b.move_out_date);
  const [moveInDate, setMoveInDate] = useState(b.move_in_date);
  const [moveOutTime, setMoveOutTime] = useState(b.move_out_time_slot || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isUnpaid = b.payment_status !== 'paid';

  const moveOutWindow = b.school ? getMoveOutWindow(b.school) : null;
  const showBoxNotice = !!moveOutWindow;

  const handleSaveDates = async () => {
    if (!moveOutDate || !moveInDate || !moveOutTime) {
      setError('Please fill move-out date, move-in date, and time slot.');
      return;
    }
    setError(null);
    setSaving(true);
    const result = await updateBookingDates(b.id, moveOutDate, moveInDate, moveOutTime);
    setSaving(false);
    if (result.success) {
      setEditingDates(false);
      router.push('/booking/updated?type=dates');
      return;
    } else {
      setError(result.error);
    }
  };

  const handleDelete = async () => {
    const confirmed = await appModal.confirm({
      title: 'Cancel this booking?',
      message: 'Are you sure you want to cancel this booking? This cannot be undone.',
      confirmLabel: 'Yes, cancel booking',
      cancelLabel: 'Keep booking',
      destructive: true,
    });
    if (!confirmed) return;
    setDeleting(true);
    const result = await deleteBooking(b.id);
    setDeleting(false);
    if (result.success) router.refresh();
    else setError(result.error);
  };

  return (
    <div
      style={{
        padding: '24px',
        background: 'white',
        borderRadius: '12px',
        border: '2px solid var(--color-latte-soft)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              textTransform: 'capitalize',
              background: b.status === 'confirmed' ? 'var(--color-mint)' : b.status === 'pending' || b.status === 'pending_payment' ? '#fef3c7' : 'var(--color-latte-soft)',
              color: b.status === 'confirmed' ? '#065f46' : b.status === 'pending' || b.status === 'pending_payment' ? '#92400e' : 'var(--color-gray-700)',
            }}
          >
            {b.status.replace('_', ' ')}
          </span>
          {b.payment_status && (
            <span
              style={{
                display: 'inline-block',
                marginLeft: '8px',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: 'capitalize',
                background: b.payment_status === 'paid' ? 'var(--color-mint)' : 'var(--color-latte-soft)',
                color: b.payment_status === 'paid' ? '#065f46' : 'var(--color-gray-700)',
              }}
            >
              {b.payment_status}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
          Booked {formatDate(b.created_at)}
        </span>
      </div>

      {showBoxNotice && (
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          padding: '10px 14px',
          background: '#FEF9EC',
          border: '1px solid #F3D98B',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '0.8125rem',
          color: '#7C5C1E',
        }}>
          <span style={{ fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>📦</span>
          <div>
            <strong>Box delivery incoming</strong>
            <span style={{ marginLeft: '4px' }}>— empty boxes will be dropped off at your dorm 2–3 days before move-out. We&apos;ll contact you with the exact date.</span>
          </div>
        </div>
      )}

      {editingDates ? (
        <div style={{ marginBottom: '20px', padding: '20px', background: 'var(--color-paper)', borderRadius: '12px', border: '1px solid var(--color-latte)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '16px' }}>Change dates</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Move-out date</label>
              <input
                type="date"
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-latte)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Move-in date</label>
              <input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-latte)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Move-out time</label>
              <select
                value={moveOutTime}
                onChange={(e) => setMoveOutTime(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-latte)' }}
              >
                <option value="">Select time</option>
                {timeSlots.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p style={{ color: 'var(--color-error, #b91c1c)', fontSize: '0.875rem', marginBottom: '12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={handleSaveDates} disabled={saving} className="button-primary" style={{ padding: '8px 20px', fontSize: '0.9375rem' }}>
              {saving ? 'Saving…' : 'Save dates'}
            </button>
            <button type="button" onClick={() => { setEditingDates(false); setError(null); }} className="button-secondary" style={{ padding: '8px 20px', fontSize: '0.9375rem' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Move-out</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-coffee)' }}>{formatDate(b.move_out_date)}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>{formatTimeSlot(b.move_out_time_slot)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Move-in</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-coffee)' }}>{formatDate(b.move_in_date)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Dorm</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-coffee)' }}>{b.dorm || '—'}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
              {b.elevator_available ? 'Elevator' : ''}{b.stairs_required ? (b.elevator_available ? ' · Stairs' : 'Stairs') : ''}
            </div>
          </div>
        </div>
      )}

      {Array.isArray(b.booking_items) && b.booking_items.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Items</div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-gray-700)', fontSize: '0.9375rem', lineHeight: '1.6' }}>
            {b.booking_items.map((item, i) => (
              <li key={i}>
                {item.quantity}× {item.item_type.replace(/_/g, ' ')} — ${(item.subtotal ?? item.monthly_rate * item.quantity).toFixed(2)}/mo
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-latte-soft)' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
          {b.storage_months} month{b.storage_months !== 1 ? 's' : ''} · {(b.box_quantity ?? 0) === 0 ? '0 boxes (items only)' : `${b.box_quantity} box${(b.box_quantity ?? 0) !== 1 ? 'es' : ''}`}
        </span>
        <span style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-coffee)' }}>
          ${(b.total_price ?? b.total_monthly_rate * (b.storage_months || 1)).toFixed(2)} total
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-latte-soft)' }}>
        {/* Change dates — available for all bookings */}
        {!editingDates && (
          <button type="button" onClick={() => setEditingDates(true)} className="button-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
            Change dates
          </button>
        )}
        {/* Change boxes & items — available for all bookings */}
        <Link href={`/booking/edit/${b.id}`}>
          <button type="button" className="button-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
            {isUnpaid ? 'Change boxes & items' : 'Add boxes & items'}
          </button>
        </Link>
        {/* Cancel booking — available for all bookings */}
        <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding: '8px 16px', fontSize: '0.875rem', background: 'transparent', color: 'var(--color-gray-600)', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: deleting ? 'wait' : 'pointer' }}>
          {deleting ? 'Cancelling…' : 'Cancel booking'}
        </button>
      </div>
    </div>
  );
}
