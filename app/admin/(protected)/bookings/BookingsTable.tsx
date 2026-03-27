'use client';

import { useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronDown, ChevronUp, Eye, Banknote, XCircle } from 'lucide-react';
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

import { formatDateShort } from '@/lib/utils/date';
import { SCHOOL_DORMS, SCHOOL_NAMES } from '@/lib/schools/config';
import { summarizeBookingItemsLine } from '@/lib/booking/item-display';

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

function BookingsTableContent({ initialBookings, total, currentPage, filters, sortBy, sortOrder }: BookingsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appModal = useAppModal();
  const [selectedBooking, setSelectedBooking] = useState<BookingWithCustomer | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const schools = SCHOOL_NAMES;
  const dormOptions = useMemo(() => {
    if (!filters.school) return [];
    return SCHOOL_DORMS[filters.school] || [];
  }, [filters.school]);

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
      message: 'This will mark the booking as paid and confirmed. The amount will count toward revenue. Continue?',
      confirmLabel: 'Mark as paid',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    setActionPending(true);
    try {
      const result = await markBookingPaid(bookingId);
      if (result.success) {
        router.refresh();
      } else {
        await appModal.alert({ title: 'Error', message: result.error });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      await appModal.alert({ title: 'Error', message });
    } finally {
      setActionPending(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    const confirmed = await appModal.confirm({
      title: 'Cancel this booking?',
      message: 'This will permanently cancel the booking. This cannot be undone.',
      confirmLabel: 'Yes, cancel',
      cancelLabel: 'Keep booking',
      destructive: true,
    });
    if (!confirmed) return;

    setActionPending(true);
    try {
      const result = await adminCancelBooking(bookingId);
      if (result.success) {
        router.refresh();
      } else {
        await appModal.alert({ title: 'Error', message: result.error });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      await appModal.alert({ title: 'Error', message });
    } finally {
      setActionPending(false);
    }
  };

  const totalPages = Math.ceil(total / 25);

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-gray-500)',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  };

  return (
    <div className="admin-bookings-stack">
      {filters.userId && (
        <p style={{ fontSize: '14px', color: 'var(--color-gray-600)', marginBottom: '16px' }}>
          Showing bookings for one customer.{' '}
          <Link href="/admin/bookings" style={{ color: 'var(--color-gray-900)', fontWeight: 600 }}>
            Show all bookings
          </Link>
        </p>
      )}

      {/* Filters */}
      <div className="admin-card admin-filters-card">
        <div className="admin-section-header">Filters</div>
        <div className="admin-filters-grid">
          <div>
            <label style={labelStyle}>Search</label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '28px',
                  color: 'var(--color-gray-400)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Name, email, phone..."
                value={filters.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value, page: 1 })}
                className="admin-input"
                style={{
                  width: '100%',
                  paddingLeft: '56px',
                  minHeight: '48px',
                }}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>School</label>
            <select
              value={filters.school || ''}
              onChange={(e) => {
                const school = e.target.value || undefined;
                updateFilters({ school, dorm: undefined, page: 1 });
              }}
              className="admin-select"
              style={{ width: '100%' }}
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
            <label style={labelStyle}>Dorm</label>
            <select
              value={filters.dorm || ''}
              onChange={(e) => updateFilters({ dorm: e.target.value || undefined, page: 1 })}
              disabled={!filters.school}
              className="admin-select"
              style={{
                width: '100%',
                backgroundColor: !filters.school ? 'var(--color-gray-50)' : 'var(--color-white)',
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
            <label style={labelStyle}>Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => updateFilters({ status: e.target.value || undefined, page: 1 })}
              className="admin-select"
              style={{ width: '100%' }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Payment</label>
            <select
              value={filters.payment_status || ''}
              onChange={(e) => updateFilters({ payment_status: e.target.value || undefined, page: 1 })}
              className="admin-select"
              style={{ width: '100%' }}
            >
              <option value="">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date Type</label>
            <select
              value={filters.dateType || 'move_out'}
              onChange={(e) => updateFilters({ dateType: e.target.value as any, page: 1 })}
              className="admin-select"
              style={{ width: '100%' }}
            >
              <option value="move_out">Move-out Date</option>
              <option value="move_in">Move-in Date</option>
              <option value="created">Created Date</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>From</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilters({ dateFrom: e.target.value || undefined, page: 1 })}
              className="admin-input"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={labelStyle}>To</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilters({ dateTo: e.target.value || undefined, page: 1 })}
              className="admin-input"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table admin-table-bookings" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
            <thead>
              <tr>
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => updateFilters({ sortBy: 'move_out_date', sortOrder: sortBy === 'move_out_date' && sortOrder === 'desc' ? 'asc' : 'desc' })}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Move-out
                    {sortBy === 'move_out_date' && (sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                  </span>
                </th>
                <th>Customer</th>
                <th>Dorm / Room</th>
                <th>What&apos;s stored</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center', fontSize: '15px', color: 'var(--color-gray-600)' }}>
                    No bookings found matching your filters.
                  </td>
                </tr>
              ) : (
                initialBookings.map((b) => (
                  <tr key={b.id}>
                    <td data-label="Move-out">
                      <div style={{ fontWeight: 600, color: 'var(--color-coffee-dark)' }}>{formatDate(b.move_out_date)}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-gray-600)', marginTop: '4px' }}>{formatTimeSlot(b.move_out_time_slot)}</div>
                    </td>
                    <td data-label="Customer">
                      <div style={{ fontWeight: 600, color: 'var(--color-coffee-dark)' }}>{b.customer?.full_name?.trim() || b.customer?.email || '—'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-gray-600)', marginTop: '4px' }}>{b.customer?.full_name ? (b.customer?.email || '—') : (b.customer?.phone || '—')}</div>
                    </td>
                    <td data-label="Dorm / room" style={{ color: 'var(--color-coffee)' }}>
                      <div>{b.dorm || '—'}</div>
                      {(b as any).room && <div style={{ fontSize: '13px', color: 'var(--color-gray-600)', marginTop: '2px' }}>Room {(b as any).room}</div>}
                    </td>
                    <td data-label="Stored items" style={{ maxWidth: '280px' }}>
                      <div
                        style={{ fontSize: '13px', color: 'var(--color-gray-700)', lineHeight: 1.45 }}
                        title={summarizeBookingItemsLine(b.items, 500)}
                      >
                        {summarizeBookingItemsLine(b.items)}
                      </div>
                    </td>
                    <td data-label="Status">
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span
                          className={
                            b.status === 'confirmed'
                              ? 'admin-badge admin-badge-success'
                              : b.status === 'pending' || b.status === 'pending_payment'
                              ? 'admin-badge admin-badge-warning'
                              : 'admin-badge admin-badge-danger'
                          }
                        >
                          {b.status.replace('_', ' ')}
                        </span>
                        <span className={b.payment_status === 'paid' ? 'admin-badge admin-badge-success' : 'admin-badge admin-badge-danger'}>
                          {b.payment_status}
                        </span>
                      </div>
                    </td>
                    <td data-label="Total" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-coffee-dark)' }}>
                      ${b.total_price.toFixed(2)}
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-grid', gridTemplateColumns: b.payment_status !== 'paid' ? '1fr 1fr' : '1fr', gap: '6px', width: '100%', maxWidth: '220px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="admin-btn admin-btn-ghost"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        {b.payment_status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(b.id)}
                            disabled={actionPending}
                            className="admin-btn admin-btn-primary"
                          >
                            <Banknote size={14} />
                            Mark Paid
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCancel(b.id)}
                          disabled={actionPending}
                          className="admin-btn admin-btn-danger"
                          style={{ gridColumn: b.payment_status !== 'paid' ? '1 / -1' : undefined }}
                        >
                          <XCircle size={14} />
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
            className="admin-pagination-bar"
          >
            <div style={{ fontSize: '14px', color: 'var(--color-gray-500)' }}>
              Showing {(currentPage - 1) * 25 + 1}–{Math.min(currentPage * 25, total)} of {total}
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => updateFilters({ page: currentPage - 1 })}
                disabled={currentPage === 1}
                className="admin-btn admin-btn-ghost"
              >
                Previous
              </button>
              <span style={{ padding: '0 16px', fontSize: '14px', color: 'var(--color-gray-600)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => updateFilters({ page: currentPage + 1 })}
                disabled={currentPage === totalPages}
                className="admin-btn admin-btn-ghost"
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

export function BookingsTable(props: BookingsTableProps) {
  return (
    <Suspense fallback={<div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-coffee)' }}>Loading...</div>}>
      <BookingsTableContent {...props} />
    </Suspense>
  );
}
