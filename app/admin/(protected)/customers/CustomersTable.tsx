'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ExternalLink, Check, X } from 'lucide-react';
import type { CustomerRow } from '@/lib/admin/actions';
import { setCustomerDepositPaid } from '@/lib/admin/actions';
import { useAppModal } from '@/app/components/AppModalProvider';
import { VenmoNoteChip } from '@/app/components/admin/VenmoNoteChip';
import { buildVenmoNote } from '@/lib/payment/venmo';

function fmtMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const appModal = useAppModal();

  const toggleDeposit = async (c: CustomerRow) => {
    const nextValue = !c.deposit_paid;
    const label = c.full_name?.trim() || c.email || 'this customer';
    const isStripeDeposit = c.deposit_paid && c.deposit_provider === 'stripe';
    const confirmed = await appModal.confirm({
      title: nextValue ? `Mark deposit as paid?` : `Undo deposit for ${label}?`,
      message: nextValue
        ? `Only use this after you have confirmed a $50 Venmo (or other manual) payment from ${label}. If they paid the deposit with Stripe on the website, it is already recorded — you do not need to click this. When you confirm, they can book immediately.`
        : isStripeDeposit
          ? `This student paid the deposit through Stripe on the site. Only undo if you intentionally need to lock them out again (for example a refund or fraud case). Otherwise they will lose booking access until they pay again.`
          : `This will lock ${label} out of the booking flow until they pay the $50 again.`,
      confirmLabel: nextValue ? 'Yes, mark paid' : 'Yes, undo',
      cancelLabel: 'Cancel',
      destructive: !nextValue,
    });
    if (!confirmed) return;

    setPendingId(c.id);
    try {
      const result = await setCustomerDepositPaid(c.id, nextValue);
      if (!result.success) {
        await appModal.alert({ title: 'Error', message: result.error });
        return;
      }
      startTransition(() => router.refresh());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      await appModal.alert({ title: 'Error', message });
    } finally {
      setPendingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.school_display?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Search */}
      <div className="admin-card admin-filters-card">
        <div className="admin-section-header">Find a Student</div>
        <div style={{ position: 'relative', maxWidth: '480px', width: '100%' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-gray-400)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email, phone, or school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ width: '100%', paddingLeft: '44px' }}
          />
        </div>
        {search && (
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-gray-500)' }}>
            Showing {filtered.length} of {customers.length} students
          </p>
        )}
      </div>

      {/* Table */}
      <div className="admin-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div className="admin-customers-table-wrap">
          <table className="admin-table admin-table-customers" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>School</th>
                <th style={{ textAlign: 'center' }}>Deposit</th>
                <th style={{ textAlign: 'right' }}>Collected</th>
                <th style={{ textAlign: 'right' }}>Balance due</th>
                <th style={{ textAlign: 'center' }}>Bookings</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px 24px', textAlign: 'center', fontSize: '15px', color: 'var(--color-gray-600)' }}>
                    {search ? 'No students match your search.' : 'No customers found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Name">
                      <div style={{ fontWeight: 600, color: 'var(--color-coffee-dark)' }}>
                        {c.full_name?.trim() || '—'}
                      </div>
                    </td>
                    <td data-label="Email" style={{ color: 'var(--color-gray-700)', wordBreak: 'break-word' }}>
                      {c.email || '—'}
                    </td>
                    <td data-label="Phone" style={{ color: 'var(--color-gray-700)' }}>
                      {c.phone || '—'}
                    </td>
                    <td data-label="School" style={{ color: 'var(--color-coffee-dark)', wordBreak: 'break-word' }}>
                      <div style={{ fontWeight: 500 }}>{c.school_display || '—'}</div>
                      {c.school_display && !c.school && (
                        <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginTop: '2px' }}>From booking</div>
                      )}
                    </td>
                    <td data-label="Deposit" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                        <span
                          className={
                            c.deposit_paid
                              ? 'admin-badge admin-badge-success'
                              : 'admin-badge admin-badge-neutral'
                          }
                        >
                          {c.deposit_paid
                            ? c.deposit_provider === 'stripe'
                              ? 'Paid · Stripe'
                              : c.deposit_provider === 'venmo'
                                ? 'Paid · Venmo'
                                : 'Paid'
                            : 'Not paid'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleDeposit(c)}
                          disabled={(pendingId === c.id) || isPending}
                          className="admin-btn admin-btn-ghost"
                          style={{ fontSize: '12px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: (pendingId === c.id) ? 0.6 : 1 }}
                          title={
                            c.deposit_paid
                              ? 'Undo deposit (re-lock booking)'
                              : 'Mark $50 deposit received after Venmo or other manual payment (Stripe deposits are automatic)'
                          }
                        >
                          {c.deposit_paid ? <X size={12} /> : <Check size={12} />}
                          {c.deposit_paid ? 'Undo' : 'Mark paid'}
                        </button>
                        {!c.deposit_paid && (c.email || c.full_name) && (
                          <VenmoNoteChip
                            note={buildVenmoNote({
                              kind: 'deposit',
                              firstName: c.full_name?.trim().split(/\s+/)[0] ?? null,
                              email: c.email,
                            })}
                          />
                        )}
                      </div>
                    </td>
                    <td data-label="Collected" style={{ textAlign: 'right', fontWeight: 600, color: '#15803d' }}>
                      <div>{fmtMoney(c.total_paid)}</div>
                      {c.paid_booking_count > 0 && (
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-gray-500)' }}>
                          {c.paid_booking_count} paid
                        </div>
                      )}
                    </td>
                    <td data-label="Balance due" style={{ textAlign: 'right', fontWeight: 600, color: c.total_outstanding > 0 ? '#b45309' : 'var(--color-gray-600)' }}>
                      <div>{fmtMoney(c.total_outstanding)}</div>
                      {c.unpaid_booking_count > 0 && (
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-gray-500)' }}>
                          {c.unpaid_booking_count} unpaid
                        </div>
                      )}
                    </td>
                    <td data-label="Bookings" style={{ textAlign: 'center' }}>
                      <span
                        className={
                          c.booking_count > 0
                            ? 'admin-badge admin-badge-success'
                            : 'admin-badge admin-badge-neutral'
                        }
                      >
                        {c.booking_count} booking{c.booking_count !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'center' }}>
                      <Link
                        href={`/admin/bookings?userId=${encodeURIComponent(c.id)}`}
                        className="admin-btn admin-btn-ghost"
                        style={{ textDecoration: 'none', display: 'inline-flex' }}
                      >
                        <ExternalLink size={14} />
                        View Bookings
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div style={{
            padding: '20px 32px',
            borderTop: '1px solid var(--color-gray-100)',
            fontSize: '13px',
            color: 'var(--color-gray-500)',
            background: 'var(--color-white)',
            lineHeight: 1.5,
          }}>
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
            {search ? ` matching "${search}"` : ' total'}
            . <strong>Deposit</strong> is the $50 commitment flag. Stripe deposits on the site flip to <strong>Paid · Stripe</strong> automatically; use <strong>Mark paid</strong> only after you confirm a <strong>Venmo</strong> (or other manual) transfer. When status is “Not paid”, the <strong>Venmo note</strong> chip shows the exact text for a Venmo payment (click to copy, then match in Venmo). <strong>School</strong> is from signup when present, otherwise the latest non-cancelled booking campus. <strong>Collected</strong> sums succeeded <strong>payments</strong> (deposits, full pay, installments) plus legacy paid bookings with no payment rows. <strong>Balance due</strong> is unpaid bookings’ contract total minus payments recorded toward that booking.
            
          </div>
        )}
      </div>
    </div>
  );
}
