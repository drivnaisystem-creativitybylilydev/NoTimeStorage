'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BookingWithCustomer, BookingsFilters } from '@/lib/admin/actions';
import { markBookingPaid, adminCancelBooking } from '@/lib/admin/actions';
import { useAppModal } from '@/app/components/AppModalProvider';
import { BookingDetailModal } from './BookingDetailModal';

type BookingsTableProps = {
  initialBookings: BookingWithCustomer[];
  total: number;
  currentPage: number;
  filters: BookingsFilters;
  sortBy: 'move_out_date' | 'move_in_date' | 'created_at';
  sortOrder: 'asc' | 'desc';
};

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export function BookingsTable({ initialBookings, total, currentPage, filters, sortBy, sortOrder }: BookingsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appModal = useAppModal();
  const [selectedBooking, setSelectedBooking] = useState<BookingWithCustomer | null>(null);
  const [isPending, startTransition] = useTransition();

  // For now we only have Stonehill, but structure is ready for multiple schools
  const SCHOOL_DORMS: Record<string, string[]> = useMemo(
    () => ({
      'Stonehill College': [
        'Boland Hall',
        'Corning Hall',
        'Cushing-Martin Hall',
        'Duffy Hall',
        'Gate House',
        'Holy Cross Hall',
        'Joseph Martin Institute',
        'New Hall',
        `O'Hara Hall`,
        'Pilgrim Heights',
        'Shields Science Center',
        'Southeast & Southwest Quadrangles',
        'Stucker House',
        'The Knoll',
        'Townhouses',
        'Off-Campus Housing',
      ],
      // Future: add other schools and their dorms here
      // 'Babson College': ['Dorm A', 'Dorm B'],
    }),
    []
  );

  const schools = useMemo(() => Object.keys(SCHOOL_DORMS), [SCHOOL_DORMS]);
  const dormOptions = useMemo(() => {
    if (!filters.school) return [];
    return SCHOOL_DORMS[filters.school] || [];
  }, [SCHOOL_DORMS, filters.school]);

  const updateFilters = (updates: Partial<BookingsFilters & { sortBy?: string; sortOrder?: string; page?: number }>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    if (!updates.page) params.set('page', '1');
    router.push(`/admin/bookings?${params.toString()}`);
  };

  const handleMarkPaid = async (bookingId: string) => {
    const confirmed = await appModal.confirm({
      title: 'Mark booking as paid?',
      message: 'This will mark the booking as paid and confirmed. Continue?',
      confirmLabel: 'Mark as paid',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    startTransition(async () => {
      const result = await markBookingPaid(bookingId);
      if (result.success) {
        router.refresh();
      } else {
        await appModal.alert({ title: 'Error', message: result.error });
      }
    });
  };

  const handleCancel = async (bookingId: string) => {
    const confirmed = await appModal.confirm({
      title: 'Cancel this booking?',
      message: 'This will permanently delete the booking. This cannot be undone.',
      confirmLabel: 'Yes, cancel',
      cancelLabel: 'Keep booking',
      destructive: true,
    });
    if (!confirmed) return;

    startTransition(async () => {
      const result = await adminCancelBooking(bookingId);
      if (result.success) {
        router.refresh();
      } else {
        await appModal.alert({ title: 'Error', message: result.error });
      }
    });
  };

  const totalPages = Math.ceil(total / 25);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-coffee)', marginBottom: '4px' }}>
          Bookings
        </h1>
        <p style={{ fontSize: '0.98rem', color: 'var(--color-gray-600)' }}>
          Manage all student bookings. Filter, search, and take actions.
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          padding: '20px',
          background: 'var(--color-white)',
          borderRadius: '12px',
          border: '1px solid var(--color-latte-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Name, email, phone..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value, page: 1 })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-latte-soft)',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              School
            </label>
            <select
              value={filters.school || ''}
              onChange={(e) => {
                const school = e.target.value || undefined;
                // Reset dorm when school changes
                updateFilters({ school, dorm: undefined, page: 1 });
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-latte-soft)',
                fontSize: '0.9rem',
              }}
            >
              <option value="">All</option>
              {schools.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dorm
            </label>
            <select
              value={filters.dorm || ''}
              onChange={(e) => updateFilters({ dorm: e.target.value || undefined, page: 1 })}
              disabled={!filters.school}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-latte-soft)',
                fontSize: '0.9rem',
                backgroundColor: !filters.school ? 'var(--color-gray-100)' : 'var(--color-white)',
              }}
            >
              <option value="">{filters.school ? 'All dorms' : 'Select a school first'}</option>
              {dormOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => updateFilters({ status: e.target.value || undefined, page: 1 })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-latte-soft)',
                fontSize: '0.9rem',
              }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Payment
            </label>
            <select
              value={filters.payment_status || ''}
              onChange={(e) => updateFilters({ payment_status: e.target.value || undefined, page: 1 })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-latte-soft)',
                fontSize: '0.9rem',
              }}
            >
              <option value="">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Date Type
            </label>
            <select
              value={filters.dateType || 'move_out'}
              onChange={(e) => updateFilters({ dateType: e.target.value as any, page: 1 })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-latte-soft)',
                fontSize: '0.9rem',
              }}
            >
              <option value="move_out">Move-out Date</option>
              <option value="move_in">Move-in Date</option>
              <option value="created">Created Date</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              From
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilters({ dateFrom: e.target.value || undefined, page: 1 })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-latte-soft)',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              To
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilters({ dateTo: e.target.value || undefined, page: 1 })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-latte-soft)',
                fontSize: '0.9rem',
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--color-white)',
          borderRadius: '12px',
          border: '1px solid var(--color-latte-soft)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-paper)', borderBottom: '2px solid var(--color-latte-soft)' }}>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 700,
                    color: 'var(--color-coffee)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                  onClick={() => updateFilters({ sortBy: 'move_out_date', sortOrder: sortBy === 'move_out_date' && sortOrder === 'desc' ? 'asc' : 'desc' })}
                >
                  Move-out {sortBy === 'move_out_date' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--color-coffee)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Customer
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--color-coffee)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Dorm
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--color-coffee)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--color-coffee)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--color-coffee)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {initialBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-600)' }}>
                    No bookings found matching your filters.
                  </td>
                </tr>
              ) : (
                initialBookings.map((b) => (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: '1px solid var(--color-latte-soft)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-paper)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{formatDate(b.move_out_date)}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>{formatTimeSlot(b.move_out_time_slot)}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-coffee)' }}>{b.customer?.full_name || '—'}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>{b.customer?.email || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-gray-700)' }}>{b.dorm || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            background:
                              b.status === 'confirmed'
                                ? '#dcfce7'
                                : b.status === 'pending' || b.status === 'pending_payment'
                                ? '#fef3c7'
                                : '#fee2e2',
                            color:
                              b.status === 'confirmed'
                                ? '#166534'
                                : b.status === 'pending' || b.status === 'pending_payment'
                                ? '#92400e'
                                : '#991b1b',
                          }}
                        >
                          {b.status.replace('_', ' ')}
                        </span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            background: b.payment_status === 'paid' ? '#dcfce7' : '#fee2e2',
                            color: b.payment_status === 'paid' ? '#166534' : '#991b1b',
                          }}
                        >
                          {b.payment_status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-coffee)' }}>
                      ${b.total_price.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.8rem',
                            background: 'transparent',
                            border: '1px solid var(--color-latte)',
                            borderRadius: '6px',
                            color: 'var(--color-coffee)',
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                        {b.payment_status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(b.id)}
                            disabled={isPending}
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.8rem',
                              background: 'var(--color-coffee)',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              cursor: isPending ? 'wait' : 'pointer',
                              opacity: isPending ? 0.6 : 1,
                            }}
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={isPending}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.8rem',
                            background: 'transparent',
                            border: '1px solid #dc2626',
                            borderRadius: '6px',
                            color: '#dc2626',
                            cursor: isPending ? 'wait' : 'pointer',
                            opacity: isPending ? 0.6 : 1,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid var(--color-latte-soft)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)' }}>
              Showing {(currentPage - 1) * 25 + 1}–{Math.min(currentPage * 25, total)} of {total}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => updateFilters({ page: currentPage - 1 })}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  background: currentPage === 1 ? 'transparent' : 'var(--color-white)',
                  border: '1px solid var(--color-latte-soft)',
                  borderRadius: '6px',
                  color: currentPage === 1 ? 'var(--color-gray-400)' : 'var(--color-coffee)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <span style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--color-gray-700)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => updateFilters({ page: currentPage + 1 })}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  background: currentPage === totalPages ? 'transparent' : 'var(--color-white)',
                  border: '1px solid var(--color-latte-soft)',
                  borderRadius: '6px',
                  color: currentPage === totalPages ? 'var(--color-gray-400)' : 'var(--color-coffee)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedBooking && <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
    </div>
  );
}
