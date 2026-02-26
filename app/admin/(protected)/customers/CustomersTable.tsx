'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ExternalLink } from 'lucide-react';
import type { CustomerRow } from '@/lib/admin/actions';

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }, [customers, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Search */}
      <div className="admin-card" style={{ padding: '40px' }}>
        <div className="admin-section-header">Find a Student</div>
        <div style={{ position: 'relative', maxWidth: '480px' }}>
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
            placeholder="Search by name, email, or phone..."
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
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th style={{ textAlign: 'center' }}>Bookings</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', fontSize: '15px', color: 'var(--color-gray-600)' }}>
                    {search ? 'No students match your search.' : 'No customers found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-coffee-dark)' }}>
                        {c.full_name?.trim() || '—'}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-gray-700)' }}>
                      {c.email || '—'}
                    </td>
                    <td style={{ color: 'var(--color-gray-700)' }}>
                      {c.phone || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
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
                    <td style={{ textAlign: 'center' }}>
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
          }}>
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
            {search ? ` matching "${search}"` : ' total'}
          </div>
        )}
      </div>
    </div>
  );
}
