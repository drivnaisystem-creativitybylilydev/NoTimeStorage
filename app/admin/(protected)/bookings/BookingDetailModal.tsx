'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BookingWithCustomer } from '@/lib/admin/actions';

type BookingDetailModalProps = {
  booking: BookingWithCustomer;
  onClose: () => void;
};

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

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

export function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  const [items, setItems] = useState<Array<{ item_type: string; quantity: number; monthly_rate: number; subtotal: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('booking_items')
      .select('item_type, quantity, monthly_rate, subtotal')
      .eq('booking_id', booking.id)
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [booking.id]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'rgba(75, 46, 37, 0.35)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--color-paper)',
          borderRadius: '16px',
          border: '2px solid var(--color-latte)',
          boxShadow: '0 24px 48px rgba(75, 46, 37, 0.2)',
          padding: '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-coffee)' }}>Booking Details</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              color: 'var(--color-gray-600)',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Customer Info */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Customer
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Name</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{booking.customer?.full_name?.trim() || booking.customer?.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Email</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{booking.customer?.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Phone</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{booking.customer?.phone || '—'}</div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Schedule
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Move-out</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{formatDate(booking.move_out_date)}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>{formatTimeSlot(booking.move_out_time_slot)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Move-in</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{formatDate(booking.move_in_date)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Storage Duration</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{booking.storage_months} month{booking.storage_months !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Location
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Dorm</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{booking.dorm || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Room</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{(booking as any).room || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Access</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>
                  {booking.elevator_available ? 'Elevator' : ''}
                  {booking.stairs_required ? (booking.elevator_available ? ' · Stairs' : 'Stairs') : ''}
                  {!booking.elevator_available && !booking.stairs_required ? '—' : ''}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>School</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{booking.school || '—'}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Items
            </h3>
            {loading ? (
              <div style={{ color: 'var(--color-gray-600)' }}>Loading...</div>
            ) : items.length === 0 ? (
              <div style={{ color: 'var(--color-gray-600)' }}>No items</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-white)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--color-gray-700)' }}>
                      {item.quantity}× {item.item_type.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>${(item.subtotal ?? item.monthly_rate * item.quantity).toFixed(2)}/mo</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div style={{ paddingTop: '16px', borderTop: '2px solid var(--color-latte-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Monthly Rate</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-coffee)' }}>${booking.total_monthly_rate.toFixed(2)}/month</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Total Price</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-coffee)' }}>${booking.total_price.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                background:
                  booking.status === 'confirmed'
                    ? '#dcfce7'
                    : booking.status === 'pending' || booking.status === 'pending_payment'
                    ? '#fef3c7'
                    : '#fee2e2',
                color:
                  booking.status === 'confirmed'
                    ? '#166534'
                    : booking.status === 'pending' || booking.status === 'pending_payment'
                    ? '#92400e'
                    : '#991b1b',
              }}
            >
              {booking.status.replace('_', ' ')}
            </span>
            <span
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                background: booking.payment_status === 'paid' ? '#dcfce7' : '#fee2e2',
                color: booking.payment_status === 'paid' ? '#166534' : '#991b1b',
              }}
            >
              {booking.payment_status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
