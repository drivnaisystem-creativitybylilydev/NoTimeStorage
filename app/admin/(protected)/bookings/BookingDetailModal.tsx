'use client';

import type { BookingWithCustomer } from '@/lib/admin/actions';
import { formatBookingItemTypeLabel } from '@/lib/booking/item-display';

type BookingDetailModalProps = {
  booking: BookingWithCustomer;
  onClose: () => void;
};

import { formatDate as formatDateET } from '@/lib/utils/date';
function formatDate(d: string) { return formatDateET(d, { weekday: undefined, month: 'long', day: 'numeric', year: 'numeric' }); }

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
  const items = booking.items ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="admin-booking-detail-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))',
        backgroundColor: 'rgba(75, 46, 37, 0.35)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="admin-booking-detail-panel"
        style={{
          width: '100%',
          maxWidth: 'min(700px, calc(100vw - 24px))',
          maxHeight: '90vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: 'var(--color-paper)',
          borderRadius: '16px',
          border: '2px solid var(--color-latte)',
          boxShadow: '0 24px 48px rgba(75, 46, 37, 0.2)',
          padding: 'clamp(16px, 4vw, 32px)',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '12px' }}>
          <h2 style={{ fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: 800, color: 'var(--color-coffee)', margin: 0, minWidth: 0, wordBreak: 'break-word' }}>Booking Details</h2>
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
            <div className="admin-booking-detail-grid">
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
            <div className="admin-booking-detail-grid">
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Move-out</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{formatDate(booking.move_out_date)}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>{formatTimeSlot(booking.move_out_time_slot)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Move-in</div>
                <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{formatDate(booking.move_in_date)}</div>
                {booking.move_in_time_slot && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>{formatTimeSlot(booking.move_in_time_slot)}</div>
                )}
                {booking.move_in_dorm && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)', marginTop: '4px' }}>
                    📍 {booking.move_in_dorm}{booking.move_in_room ? `, Rm ${booking.move_in_room}` : ''}
                    {booking.move_in_confirmed_at && (
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '1px 6px', borderRadius: '6px' }}>Confirmed</span>
                    )}
                  </div>
                )}
                {!booking.move_in_dorm && (
                  <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '4px' }}>⚠️ Delivery dorm not confirmed</div>
                )}
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
            <div className="admin-booking-detail-grid">
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
            {items.length === 0 ? (
              <div style={{ color: 'var(--color-gray-600)' }}>No line items on file for this booking.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, i) => (
                  <div key={i} className="admin-booking-detail-item-row">
                    <span style={{ color: 'var(--color-gray-700)', minWidth: 0, wordBreak: 'break-word' }}>
                      {item.quantity}× {formatBookingItemTypeLabel(item.item_type)}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-coffee)', flexShrink: 0, textAlign: 'right', wordBreak: 'break-word' }}>
                      ${item.monthly_rate.toFixed(2)}/mo each · ${item.subtotal.toFixed(2)}/mo line
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Special Instructions */}
          {booking.special_instructions && (
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Special Instructions
              </h3>
              <div style={{ padding: '10px 14px', background: '#fef3c7', borderRadius: '8px', fontSize: '0.875rem', color: '#92400e' }}>
                {booking.special_instructions}
              </div>
            </div>
          )}

          {/* Totals */}
          <div style={{ paddingTop: '16px', borderTop: '2px solid var(--color-latte-soft)' }}>
            <div className="admin-booking-detail-totals">
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Monthly Rate</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-coffee)' }}>${booking.total_monthly_rate.toFixed(2)}/month</div>
              </div>
              <div className="admin-booking-detail-totals-right">
                <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Total Price</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-coffee)' }}>${booking.total_price.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Payment Plan */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Payment
            </h3>
            <div className="admin-booking-detail-grid admin-booking-detail-grid--payment">
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Plan</div>
                <span style={{
                  display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700,
                  background: booking.payment_plan === 'monthly' ? '#dbeafe' : '#dcfce7',
                  color: booking.payment_plan === 'monthly' ? '#1e40af' : '#166534',
                }}>
                  {booking.payment_plan === 'monthly' ? 'Monthly (3×)' : 'Pay in Full'}
                </span>
              </div>
              {booking.payment_plan === 'monthly' && (
                <>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Installment</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>
                      {booking.monthly_payment_amount ? `$${booking.monthly_payment_amount.toFixed(2)}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Remaining</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>
                      {booking.monthly_payments_remaining ?? '—'} payment{booking.monthly_payments_remaining !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Next Payment</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>
                      {booking.next_payment_date ? formatDate(booking.next_payment_date) : '—'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {(booking.square_customer_id || booking.square_invoice_id || booking.square_card_id) && (
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Legacy payment references
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {booking.square_customer_id && (
                  <div className="admin-booking-detail-mono" style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: 'var(--color-white)', padding: '6px 10px', borderRadius: '6px', color: 'var(--color-gray-700)' }}>
                    <span style={{ color: 'var(--color-gray-600)', marginRight: '8px' }}>Customer:</span>{booking.square_customer_id}
                  </div>
                )}
                {booking.square_card_id && (
                  <div className="admin-booking-detail-mono" style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: 'var(--color-white)', padding: '6px 10px', borderRadius: '6px', color: 'var(--color-gray-700)' }}>
                    <span style={{ color: 'var(--color-gray-600)', marginRight: '8px' }}>Card:</span>{booking.square_card_id}
                  </div>
                )}
                {booking.square_invoice_id && (
                  <div className="admin-booking-detail-mono" style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: 'var(--color-white)', padding: '6px 10px', borderRadius: '6px', color: 'var(--color-gray-700)' }}>
                    <span style={{ color: 'var(--color-gray-600)', marginRight: '8px' }}>Invoice:</span>{booking.square_invoice_id}
                  </div>
                )}
              </div>
            </div>
          )}

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
