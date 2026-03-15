'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateMoveInDetails } from '@/app/actions/move-in-details';
import { SCHOOL_NAMES } from '@/lib/schools/config';

type Props = {
  bookingId: string;
  moveInDate: string;
  currentSchool: string;
  currentMoveInDorm: string | null;
  currentMoveInRoom: string | null;
  currentSpecialInstructions: string | null;
  confirmedAt: string | null;
};

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export function MoveInConfirmCard({
  bookingId,
  moveInDate,
  currentSchool,
  currentMoveInDorm,
  currentMoveInRoom,
  currentSpecialInstructions,
  confirmedAt,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(!confirmedAt);
  const [school, setSchool] = useState(currentSchool);
  const [dorm, setDorm] = useState(currentMoveInDorm || '');
  const [room, setRoom] = useState(currentMoveInRoom || '');
  const [instructions, setInstructions] = useState(currentSpecialInstructions || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(!!confirmedAt);

  const handleSave = async () => {
    if (!dorm.trim()) { setError('Please enter your move-in dorm.'); return; }
    setError(null);
    setSaving(true);
    const result = await updateMoveInDetails({ bookingId, school, moveInDorm: dorm, moveInRoom: room, specialInstructions: instructions });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid var(--color-latte)',
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    background: 'white',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--color-gray-600)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  };

  return (
    <div style={{
      marginBottom: '32px',
      padding: 'clamp(16px, 4vw, 28px)',
      background: saved && !editing ? '#f0fdf4' : '#fffbeb',
      borderRadius: '12px',
      border: `2px solid ${saved && !editing ? '#86efac' : '#fbbf24'}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-coffee)', margin: 0 }}>
          {saved && !editing ? '✅ Move-In Delivery Confirmed' : '📍 Confirm Your Move-In Delivery'}
        </h2>
        {saved && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-coffee)', background: 'transparent', border: '1px solid var(--color-latte)', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer' }}
          >
            Edit
          </button>
        )}
      </div>

      <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)', marginBottom: '20px' }}>
        {saved && !editing
          ? `Your storage is being delivered on ${formatDate(moveInDate)}. We have your delivery details — we'll be in touch closer to the date.`
          : `Your storage delivery is scheduled for ${formatDate(moveInDate)}. Please confirm where we should deliver your items — you may be in a different dorm than when you booked.`
        }
      </p>

      {/* Confirmed summary */}
      {saved && !editing && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            { label: 'School', value: school },
            { label: 'Dorm', value: dorm || '—' },
            { label: 'Room', value: room || '—' },
            { label: 'Instructions', value: instructions || 'None' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--color-coffee)' }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={labelStyle}>School</label>
              <select value={school} onChange={e => setSchool(e.target.value)} style={inputStyle}>
                {SCHOOL_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Move-In Dorm <span style={{ color: '#b91c1c' }}>*</span></label>
              <input
                type="text"
                value={dorm}
                onChange={e => setDorm(e.target.value)}
                placeholder="e.g. Stonehill Hall"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Room Number</label>
              <input
                type="text"
                value={room}
                onChange={e => setRoom(e.target.value)}
                placeholder="e.g. 204"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Special Instructions (optional)</label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Parking info, entrance notes, elevator access, etc."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          {error && <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="button-primary"
              style={{ padding: '10px 24px', fontSize: '0.9375rem' }}
            >
              {saving ? 'Saving…' : 'Save & Confirm →'}
            </button>
            {saved && (
              <button
                type="button"
                onClick={() => { setEditing(false); }}
                className="button-secondary"
                style={{ padding: '10px 20px', fontSize: '0.9375rem' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
