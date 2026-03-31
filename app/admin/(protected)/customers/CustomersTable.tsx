'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ExternalLink } from 'lucide-react';
import type { CustomerRow } from '@/lib/admin/actions';

function fmtMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = useState('');

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
                <th style={{ textAlign: 'right' }}>Collected</th>
                <th style={{ textAlign: 'right' }}>Balance due</th>
                <th style={{ textAlign: 'center' }}>Bookings</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 24px', textAlign: 'center', fontSize: '15px', color: 'var(--color-gray-600)' }}>
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
            . <strong>School</strong> is from signup (profile) when present, otherwise the most recent active booking campus. <strong>Collected</strong> sums succeeded rows in <strong>payments</strong> (deposits, full pay, installments) per booking, plus legacy paid bookings with no payment rows. <strong>Balance due</strong> is unpaid bookings’ contract total minus payments already recorded toward that booking.
            
          </div>
        )}
      </div>
    </div>
  );
}
