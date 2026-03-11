'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAvailableTimeSlots } from '@/lib/booking/availability';
import { getDefaultTimeSlots } from '@/lib/booking/time-slots';
import { SCHOOL_NAMES, getDormsForSchool, getMoveOutWindow } from '@/lib/schools/config';
import { createClient } from '@/lib/supabase/client';

// Configuration: Minimum storage duration in months
const MINIMUM_STORAGE_MONTHS = 3;

function SchedulePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get configuration from URL
  const boxes = parseInt(searchParams.get('boxes') || '1');
  const additionalItems = {
    smallWithBox: parseInt(searchParams.get('smallWithBox') || '0'),
    smallWithoutBox: parseInt(searchParams.get('smallWithoutBox') || '0'),
    mediumWithBox: parseInt(searchParams.get('mediumWithBox') || '0'),
    mediumWithoutBox: parseInt(searchParams.get('mediumWithoutBox') || '0'),
    large: parseInt(searchParams.get('large') || '0'),
  };

  // State for scheduling
  const [moveOutDate, setMoveOutDate] = useState<Date | null>(null);
  const [moveInDate, setMoveInDate] = useState<Date | null>(null);
  const [selectingMoveOut, setSelectingMoveOut] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, new Date().getMonth()));
  const [moveOutTime, setMoveOutTime] = useState('');
  const [moveInTime, setMoveInTime] = useState('');
  const [dorm, setDorm] = useState('');
  const [elevatorAccess, setElevatorAccess] = useState<'yes' | 'no' | ''>('');
  const [stairsAccess, setStairsAccess] = useState<'yes' | 'no' | ''>('');
  const [roomNumber, setRoomNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [dateError, setDateError] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ value: string; label: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [school, setSchool] = useState('');
  const [dormOpen, setDormOpen] = useState(false);
  const dormDropdownRef = useRef<HTMLDivElement>(null);

  // Pre-fill school from user profile
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('users')
        .select('school')
        .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
        .limit(1)
        .single();
      if (profile?.school && SCHOOL_NAMES.includes(profile.school)) {
        setSchool(profile.school);
      }
    });
  }, []);

  const schools = SCHOOL_NAMES;
  const dorms = getDormsForSchool(school);

  const allTimeSlots = useMemo(() => getDefaultTimeSlots(), []);

  // Fetch available time slots when date + dorm are set (20-min rule for different dorms, 5-min/same time for same dorm)
  useEffect(() => {
    if (!moveOutDate || !dorm) {
      setAvailableSlots([]);
      return;
    }
    const dateStr = moveOutDate.toISOString().split('T')[0];
    setSlotsLoading(true);
    getAvailableTimeSlots(dateStr, dorm)
      .then((slots) => {
        setAvailableSlots(slots);
        setMoveOutTime((current) => {
          const stillAvailable = slots.some((s) => s.value === current);
          return stillAvailable ? current : '';
        });
      })
      .finally(() => setSlotsLoading(false));
  }, [moveOutDate, dorm]);

  // Close dorm dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dormDropdownRef.current && !dormDropdownRef.current.contains(event.target as Node)) {
        setDormOpen(false);
      }
    }
    if (dormOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dormOpen]);

  const availableSet = useMemo(
    () => new Set(availableSlots.map((s) => s.value)),
    [availableSlots]
  );

  // Calendar helpers
  const getMinimumMoveInDate = (moveOut: Date) => {
    const minDate = new Date(moveOut);
    minDate.setMonth(minDate.getMonth() + MINIMUM_STORAGE_MONTHS);
    return minDate;
  };

  const getMonthData = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const isDateInRange = (date: Date) => {
    if (!moveOutDate || !moveInDate) return false;
    return date >= moveOutDate && date <= moveInDate;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectingMoveOut) {
      // Always disable past dates
      if (date < today) return true;
      // If a school is selected and has a move-out window, restrict to that range
      const window = getMoveOutWindow(school);
      if (window) {
        return date < window.start || date > window.end;
      }
      return false;
    }

    // If selecting move-in, disable dates before minimum storage period
    if (moveOutDate) {
      const minMoveIn = getMinimumMoveInDate(moveOutDate);
      return date < minMoveIn;
    }

    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    
    if (selectingMoveOut) {
      setMoveOutDate(date);
      setMoveInDate(null);
      setSelectingMoveOut(false);
      setDateError('');
    } else {
      // Validate minimum storage duration
      if (moveOutDate) {
        const minMoveIn = getMinimumMoveInDate(moveOutDate);
        if (date < minMoveIn) {
          setDateError(`Move-in must be at least ${MINIMUM_STORAGE_MONTHS} months after move-out`);
          return;
        }
      }
      setMoveInDate(date);
      setDateError('');
    }
  };

  const resetDates = () => {
    setMoveOutDate(null);
    setMoveInDate(null);
    setSelectingMoveOut(true);
    setDateError('');
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset));
  };

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  };

  const monthData = useMemo(() => getMonthData(currentMonth.getFullYear(), currentMonth.getMonth()), [currentMonth]);

  const isFormValid = moveOutDate && moveInDate && moveOutTime && moveInTime && school && dorm && elevatorAccess && stairsAccess && roomNumber.trim();

  const handleContinue = () => {
    if (!isFormValid) return;

    const params = new URLSearchParams({
      boxes: boxes.toString(),
      ...Object.fromEntries(
        Object.entries(additionalItems)
          .filter(([_, value]) => value > 0)
          .map(([key, value]) => [key, value.toString()])
      ),
      moveOutDate: moveOutDate!.toISOString().split('T')[0],
      moveInDate: moveInDate!.toISOString().split('T')[0],
      moveOutTime,
      moveInTime,
      school,
      dorm,
      elevator: elevatorAccess,
      stairs: stairsAccess,
      room: roomNumber,
      instructions: specialInstructions,
    });
    router.push(`/booking/payment?${params.toString()}`);
  };

  // Render calendar days
  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = monthData;
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} style={{ width: 'clamp(32px, 10vw, 40px)', height: 'clamp(32px, 10vw, 40px)' }} />);
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDateDisabled(date);
      const isSelected = (moveOutDate && date.toDateString() === moveOutDate.toDateString()) || 
                        (moveInDate && date.toDateString() === moveInDate.toDateString());
      const inRange = isDateInRange(date);
      const isMoveOut = moveOutDate && date.toDateString() === moveOutDate.toDateString();
      const isMoveIn = moveInDate && date.toDateString() === moveInDate.toDateString();
      
        days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          disabled={disabled}
          style={{
            width: 'clamp(32px, 10vw, 40px)',
            height: 'clamp(32px, 10vw, 40px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: isSelected 
              ? '#8B5A47' 
              : inRange 
                ? 'rgba(139, 90, 71, 0.35)' 
                : 'transparent',
            color: disabled 
              ? '#D1D5DB' 
              : isSelected 
                ? 'white' 
                : inRange 
                  ? '#3A231C'
                  : '#1F2937',
            borderRadius: isSelected ? '50%' : '8px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: isSelected ? '700' : inRange ? '600' : '400',
            fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)',
            transition: 'all 0.2s ease',
            position: 'relative',
            opacity: disabled ? 0.4 : 1,
            padding: 0,
          }}
          onMouseEnter={(e) => {
            if (!disabled && !isSelected) {
              e.currentTarget.style.background = 'rgba(139, 90, 71, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && !isSelected && !inRange) {
              e.currentTarget.style.background = 'transparent';
            } else if (!disabled && inRange && !isSelected) {
              e.currentTarget.style.background = 'rgba(139, 90, 71, 0.35)';
            }
          }}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className="auth-container">
      <div style={{ maxWidth: '800px', width: '100%', background: 'white', borderRadius: '16px', padding: 'clamp(20px, 5vw, 48px)', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Link href="/">
            <Image
              src="/brand/notime-storage-logo.png"
              alt="NoTime Storage"
              width={80}
              height={80}
              style={{ marginBottom: '24px' }}
            />
          </Link>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '12px' }}>
            Schedule Your Pickup
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-gray-600)' }}>
            Choose when and where we'll pick up your items
          </p>
        </div>

        {/* Order Summary */}
        <div style={{ padding: '20px', background: 'var(--color-paper)', borderRadius: '12px', marginBottom: '32px', border: '1px solid var(--color-latte)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '12px' }}>
            📦 Your Order
          </h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>
            {boxes === 0
              ? (Object.values(additionalItems).some(v => v > 0)
                  ? `${Object.values(additionalItems).reduce((a, b) => a + b, 0)} item(s) only (no boxes)`
                  : '0 boxes')
              : `${boxes} box${boxes !== 1 ? 'es' : ''}`}
            {boxes > 0 && Object.values(additionalItems).some(v => v > 0) && (
              <span> + {Object.values(additionalItems).reduce((a, b) => a + b, 0)} additional item(s)</span>
            )}
          </div>
        </div>

        {/* Calendar Widget */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '16px' }}>
            Select Your Dates
          </h2>
          
          {/* Date Selection Status */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ 
              flex: 1, 
              padding: '16px', 
              background: selectingMoveOut ? 'var(--color-latte-soft)' : 'white',
              border: `2px solid ${selectingMoveOut ? 'var(--color-coffee)' : 'var(--color-latte)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => { setSelectingMoveOut(true); setMoveInDate(null); }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-600)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Move-Out
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-coffee)' }}>
                {formatDateDisplay(moveOutDate)}
              </div>
            </div>
            
            <div style={{ 
              flex: 1, 
              padding: '16px', 
              background: !selectingMoveOut && moveOutDate ? 'var(--color-latte-soft)' : 'white',
              border: `2px solid ${!selectingMoveOut && moveOutDate ? 'var(--color-coffee)' : 'var(--color-latte)'}`,
              borderRadius: '12px',
              opacity: moveOutDate ? 1 : 0.5,
              cursor: moveOutDate ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
            onClick={() => { if (moveOutDate) setSelectingMoveOut(false); }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-600)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Move-In (Min. {MINIMUM_STORAGE_MONTHS} months)
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-coffee)' }}>
                {formatDateDisplay(moveInDate)}
              </div>
            </div>
          </div>

          {selectingMoveOut && school && (() => {
            const w = getMoveOutWindow(school);
            if (!w) return null;
            const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
            return (
              <div style={{ padding: '10px 14px', background: 'var(--color-latte-soft)', border: '1px solid var(--color-latte)', borderRadius: '8px', color: 'var(--color-coffee)', fontSize: '0.875rem', marginBottom: '16px', fontWeight: 500 }}>
                📅 Move-out pickup for {school.split(' ').slice(-1)[0]}: <strong>{fmt(w.start)} – {fmt(w.end)}</strong>
              </div>
            );
          })()}

          {dateError && (
            <div style={{ padding: '12px', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '8px', color: '#B91C1C', fontSize: '0.875rem', marginBottom: '16px' }}>
              {dateError}
            </div>
          )}

          {/* Calendar */}
          <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(12px, 4vw, 24px)', border: '2px solid var(--color-latte)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {/* Calendar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <button
                onClick={() => changeMonth(-1)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--color-coffee)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-latte-soft)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                ‹
              </button>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coffee)' }}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' })}
              </h3>
              
              <button
                onClick={() => changeMonth(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--color-coffee)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-latte-soft)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                ›
              </button>
            </div>

            {/* Day Labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
              {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(day => (
                <div key={day} style={{ 
                  textAlign: 'center', 
                  fontSize: '0.75rem', 
                  fontWeight: '600', 
                  color: 'var(--color-gray-600)',
                  padding: '8px 0'
                }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {renderCalendar()}
            </div>

            {/* Reset Button */}
            {(moveOutDate || moveInDate) && (
              <button
                onClick={resetDates}
                style={{
                  marginTop: '20px',
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  border: '2px solid var(--color-latte)',
                  borderRadius: '8px',
                  color: 'var(--color-coffee)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-latte-soft)';
                  e.currentTarget.style.borderColor = 'var(--color-coffee)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--color-latte)';
                }}
              >
                Reset Dates
              </button>
            )}
          </div>
        </div>

        {/* School Selection */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label htmlFor="school-select" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-coffee)' }}>
            Your College / University *
          </label>
          <select
            id="school-select"
            value={school}
            onChange={(e) => {
              const newSchool = e.target.value;
              setSchool(newSchool);
              setDorm('');
              // Reset move-out date if it falls outside the new school's window
              const window = getMoveOutWindow(newSchool);
              if (window) {
                if (moveOutDate && (moveOutDate < window.start || moveOutDate > window.end)) {
                  setMoveOutDate(null);
                  setMoveInDate(null);
                  setSelectingMoveOut(true);
                }
                // Jump calendar to the school's move-out month
                setCurrentMonth(new Date(window.start.getFullYear(), window.start.getMonth()));
              }
            }}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              border: `2px solid ${school ? 'var(--color-coffee)' : 'var(--color-latte)'}`,
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontFamily: 'inherit',
              color: school ? 'var(--color-coffee-dark)' : 'var(--color-gray-500)',
              background: 'white',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234B2E25' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              paddingRight: '40px',
            }}
          >
            <option value="">Select your school</option>
            {schools.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Dorm Selection – branded dropdown (before time so we can show only available slots) */}
        <div className="form-group" style={{ marginBottom: '24px' }} ref={dormDropdownRef}>
          <label id="dorm-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-coffee)' }}>
            Residence Hall / Location *
          </label>
          {school && dorms.length === 0 && (
            <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--color-latte)', fontWeight: 500 }}>
              Residence halls for {school} are being added. Please check back soon or contact us.
            </p>
          )}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              id="dorm"
              aria-haspopup="listbox"
              aria-expanded={dormOpen}
              aria-labelledby="dorm-label"
              aria-required
              disabled={!school}
              onClick={() => school && setDormOpen((o) => !o)}
              style={{
                width: '100%',
                padding: '14px 40px 14px 14px',
                border: `2px solid ${dorm ? 'var(--color-coffee)' : 'var(--color-latte)'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                textAlign: 'left',
                boxSizing: 'border-box',
                backgroundColor: !school ? 'var(--color-gray-50)' : 'var(--color-white)',
                color: dorm ? 'var(--color-coffee-dark)' : 'var(--color-gray-500)',
                fontWeight: 500,
                cursor: !school ? 'not-allowed' : 'pointer',
                appearance: 'none',
                position: 'relative',
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
                opacity: !school ? 0.6 : 1,
              }}
              onFocus={() => school && setDormOpen(true)}
              onBlur={() => {}}
            >
              {dorm || (school ? 'Select your dorm or residence' : 'Select your school first')}
            </button>
            <span
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: dormOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)',
                transition: 'transform 0.2s ease',
                color: 'var(--color-coffee)',
                pointerEvents: 'none',
              }}
              aria-hidden
            >
              ▼
            </span>
            {dormOpen && (
              <ul
                role="listbox"
                aria-labelledby="dorm-label"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '100%',
                  margin: 0,
                  marginTop: '4px',
                  padding: '8px 0',
                  listStyle: 'none',
                  backgroundColor: 'var(--color-white)',
                  border: '2px solid var(--color-latte)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(75, 46, 37, 0.12)',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  zIndex: 50,
                }}
              >
                <li
                  role="option"
                  aria-selected={!dorm}
                  onClick={() => {
                    setDorm('');
                    setDormOpen(false);
                  }}
                  style={{
                    padding: '12px 14px',
                    fontSize: '0.9375rem',
                    color: 'var(--color-gray-500)',
                    cursor: 'pointer',
                    backgroundColor: !dorm ? 'var(--color-latte-soft)' : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (dorm) e.currentTarget.style.backgroundColor = 'var(--color-latte-soft)';
                  }}
                  onMouseLeave={(e) => {
                    if (dorm) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Select your dorm or residence
                </li>
                {dorms.map((dormName) => (
                  <li
                    key={dormName}
                    role="option"
                    aria-selected={dorm === dormName}
                    onClick={() => {
                      setDorm(dormName);
                      setDormOpen(false);
                    }}
                    style={{
                      padding: '12px 14px',
                      fontSize: '0.9375rem',
                      color: 'var(--color-coffee-dark)',
                      fontWeight: dorm === dormName ? 600 : 500,
                      cursor: 'pointer',
                      backgroundColor: dorm === dormName ? 'var(--color-latte-soft)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-latte-soft)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = dorm === dormName ? 'var(--color-latte-soft)' : 'transparent';
                    }}
                  >
                    {dorm === dormName && (
                      <span style={{ color: 'var(--color-coffee)', fontWeight: 700 }}>✓</span>
                    )}
                    {dormName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Move-Out Time: Calendly-style time blocks (available = clickable, unavailable = grayed out) */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label id="moveOutTime-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-coffee)' }}>
            Preferred Time Slot *
          </label>
          {(!moveOutDate || !dorm) && (
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-gray-600)', marginBottom: '12px' }}>
              Select your move-out date and residence above to see available times.
            </p>
          )}
          {moveOutDate && dorm && slotsLoading && (
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-gray-600)', marginBottom: '12px' }}>
              Loading available times…
            </p>
          )}
          {moveOutDate && dorm && !slotsLoading && (
            <>
              <div
                role="group"
                aria-labelledby="moveOutTime-label"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '10px',
                }}
              >
                {allTimeSlots.map((slot) => {
                  const available = availableSet.has(slot.value);
                  const selected = moveOutTime === slot.value;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      disabled={!available}
                      onClick={() => available && setMoveOutTime(slot.value)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: `2px solid ${selected ? 'var(--color-coffee)' : available ? 'var(--color-latte)' : 'var(--color-gray-200)'}`,
                        background: selected ? 'var(--color-coffee)' : available ? 'white' : 'var(--color-gray-100)',
                        color: selected ? 'var(--color-latte-soft)' : available ? 'var(--color-coffee)' : 'var(--color-gray-400)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: available ? 'pointer' : 'not-allowed',
                        transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (available && !selected) {
                          e.currentTarget.style.background = 'var(--color-latte-soft)';
                          e.currentTarget.style.borderColor = 'var(--color-coffee)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (available && !selected) {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = 'var(--color-latte)';
                        }
                      }}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
              <small style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginTop: '10px', display: 'block' }}>
                Choose an available time. Gray slots are already taken. 20 min between different dorms; same dorm can share or use 5 min apart.
              </small>
            </>
          )}
        </div>

        {/* Move-In Time */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label id="moveInTime-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-coffee)' }}>
            Preferred Move-In Time *
          </label>
          {!moveInDate && (
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-gray-600)', marginBottom: '12px' }}>
              Select your move-in date above to choose a delivery time.
            </p>
          )}
          {moveInDate && (
            <div
              role="group"
              aria-labelledby="moveInTime-label"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}
            >
              {allTimeSlots.map((slot) => {
                const selected = moveInTime === slot.value;
                return (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setMoveInTime(slot.value)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `2px solid ${selected ? 'var(--color-coffee)' : 'var(--color-latte)'}`,
                      background: selected ? 'var(--color-coffee)' : 'white',
                      color: selected ? 'var(--color-latte-soft)' : 'var(--color-coffee)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = 'var(--color-latte-soft)';
                        e.currentTarget.style.borderColor = 'var(--color-coffee)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = 'var(--color-latte)';
                      }
                    }}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Elevator + Stairs — compact side by side */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-coffee)', fontSize: '0.875rem' }}>
              Elevator Available? *
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['yes', 'no'] as const).map((val) => (
                <label key={val} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 14px',
                  border: `2px solid ${elevatorAccess === val ? 'var(--color-coffee)' : 'var(--color-latte)'}`,
                  borderRadius: '6px', cursor: 'pointer',
                  backgroundColor: elevatorAccess === val ? 'var(--color-latte-soft)' : 'white',
                  transition: 'all 0.2s ease', fontSize: '0.8rem', fontWeight: '500',
                }}>
                  <input type="radio" name="elevator" value={val} checked={elevatorAccess === val}
                    onChange={() => setElevatorAccess(val)} style={{ margin: 0, cursor: 'pointer' }} />
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-coffee)', fontSize: '0.875rem' }}>
              Stairs Required? *
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['yes', 'no'] as const).map((val) => (
                <label key={val} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 14px',
                  border: `2px solid ${stairsAccess === val ? 'var(--color-coffee)' : 'var(--color-latte)'}`,
                  borderRadius: '6px', cursor: 'pointer',
                  backgroundColor: stairsAccess === val ? 'var(--color-latte-soft)' : 'white',
                  transition: 'all 0.2s ease', fontSize: '0.8rem', fontWeight: '500',
                }}>
                  <input type="radio" name="stairs" value={val} checked={stairsAccess === val}
                    onChange={() => setStairsAccess(val)} style={{ margin: 0, cursor: 'pointer' }} />
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Room Number */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label htmlFor="room-number" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-coffee)', fontSize: '0.875rem' }}>
            Room Number *
          </label>
          <input
            id="room-number"
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. 204, Suite 3B"
            required
            style={{
              width: '100%', padding: '10px 14px',
              border: `2px solid ${roomNumber ? 'var(--color-coffee)' : 'var(--color-latte)'}`,
              borderRadius: '8px', fontSize: '0.9rem',
              boxSizing: 'border-box', fontFamily: 'inherit',
              color: 'var(--color-coffee)',
            }}
          />
        </div>

        {/* Special Instructions */}
        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label htmlFor="instructions" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-coffee)' }}>
            Special Instructions (Optional)
          </label>
          <textarea
            id="instructions"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Room number, building entrance, parking instructions, etc."
            rows={4}
            style={{
              width: '100%',
              padding: '14px',
              border: '2px solid var(--color-latte)',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Link href={`/booking/configure?${searchParams.toString()}`}>
            <button className="button-secondary" style={{ padding: '16px 24px', fontSize: '1rem' }}>
              ← Back
            </button>
          </Link>
          <button
            onClick={handleContinue}
            disabled={!isFormValid}
            className="button-primary"
            style={{
              padding: '16px 32px',
              fontSize: '1.125rem',
              opacity: isFormValid ? 1 : 0.5,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              flexShrink: 0,
            }}
          >
            Continue to Payment →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="auth-container" />}>
      <SchedulePageContent />
    </Suspense>
  );
}
