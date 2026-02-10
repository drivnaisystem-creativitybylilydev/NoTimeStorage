'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Configuration: Minimum storage duration in months
const MINIMUM_STORAGE_MONTHS = 3;

export default function SchedulePage() {
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
  const [dorm, setDorm] = useState('');
  const [elevatorAccess, setElevatorAccess] = useState<'yes' | 'no' | ''>('');
  const [stairsAccess, setStairsAccess] = useState<'yes' | 'no' | ''>('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [dateError, setDateError] = useState('');

  // Stonehill College Dorms
  const dorms = [
    'Boland Hall',
    'Corning Hall',
    'Cushing-Martin Hall',
    'Duffy Hall',
    'Gate House',
    'Holy Cross Hall',
    'Joseph Martin Institute',
    'New Hall',
    'O\'Hara Hall',
    'Pilgrim Heights',
    'Shields Science Center',
    'Southeast & Southwest Quadrangles',
    'Stucker House',
    'The Knoll',
    'Townhouses',
    'Off-Campus Housing'
  ];

  // Generate time slots (8 AM - 5 PM, 20-min intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 20) {
        const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        slots.push({ value: timeString, label: displayTime });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

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
    
    // If selecting move-out, disable past dates
    if (selectingMoveOut) {
      return date < today;
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const monthData = useMemo(() => getMonthData(currentMonth.getFullYear(), currentMonth.getMonth()), [currentMonth]);

  const isFormValid = moveOutDate && moveInDate && moveOutTime && dorm && elevatorAccess && stairsAccess;

  const handleContinue = () => {
    if (!isFormValid) return;

    // For now, redirect to a confirmation/payment placeholder
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
      dorm,
      elevator: elevatorAccess,
      stairs: stairsAccess,
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
      days.push(<div key={`empty-${i}`} style={{ width: '40px', height: '40px' }} />);
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
            width: '40px',
            height: '40px',
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
            fontSize: '0.875rem',
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
      <div style={{ maxWidth: '800px', width: '100%', background: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
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
            {boxes} box{boxes > 1 ? 'es' : ''}
            {Object.values(additionalItems).some(v => v > 0) && (
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

          {dateError && (
            <div style={{ padding: '12px', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '8px', color: '#B91C1C', fontSize: '0.875rem', marginBottom: '16px' }}>
              {dateError}
            </div>
          )}

          {/* Calendar */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid var(--color-latte)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
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
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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

        {/* Move-Out Time */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label htmlFor="moveOutTime" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-coffee)' }}>
            Preferred Time Slot *
          </label>
          <select
            id="moveOutTime"
            value={moveOutTime}
            onChange={(e) => setMoveOutTime(e.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              border: '2px solid var(--color-latte)',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
            required
          >
            <option value="">Select a time slot</option>
            {timeSlots.map(slot => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
          <small style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginTop: '4px', display: 'block' }}>
            Pickup takes approximately 5 minutes
          </small>
        </div>

        {/* Dorm Selection */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label htmlFor="dorm" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-coffee)' }}>
            Residence Hall / Location *
          </label>
          <select
            id="dorm"
            value={dorm}
            onChange={(e) => setDorm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              border: '2px solid var(--color-latte)',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
            required
          >
            <option value="">Select your dorm or residence</option>
            {dorms.map(dormName => (
              <option key={dormName} value={dormName}>{dormName}</option>
            ))}
          </select>
        </div>

        {/* Elevator Access */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: 'var(--color-coffee)', fontSize: '0.875rem' }}>
            Elevator Available? *
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 20px', 
              border: `2px solid ${elevatorAccess === 'yes' ? 'var(--color-coffee)' : 'var(--color-latte)'}`, 
              borderRadius: '8px', 
              cursor: 'pointer', 
              flex: 1, 
              backgroundColor: elevatorAccess === 'yes' ? 'var(--color-latte-soft)' : 'white',
              transition: 'all 0.2s ease',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <input
                type="radio"
                name="elevator"
                value="yes"
                checked={elevatorAccess === 'yes'}
                onChange={(e) => setElevatorAccess('yes')}
                style={{ margin: 0, cursor: 'pointer' }}
              />
              Yes
            </label>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 20px', 
              border: `2px solid ${elevatorAccess === 'no' ? 'var(--color-coffee)' : 'var(--color-latte)'}`, 
              borderRadius: '8px', 
              cursor: 'pointer', 
              flex: 1, 
              backgroundColor: elevatorAccess === 'no' ? 'var(--color-latte-soft)' : 'white',
              transition: 'all 0.2s ease',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <input
                type="radio"
                name="elevator"
                value="no"
                checked={elevatorAccess === 'no'}
                onChange={(e) => setElevatorAccess('no')}
                style={{ margin: 0, cursor: 'pointer' }}
              />
              No
            </label>
          </div>
        </div>

        {/* Stairs Access */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: 'var(--color-coffee)', fontSize: '0.875rem' }}>
            Stairs Required? *
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 20px', 
              border: `2px solid ${stairsAccess === 'yes' ? 'var(--color-coffee)' : 'var(--color-latte)'}`, 
              borderRadius: '8px', 
              cursor: 'pointer', 
              flex: 1, 
              backgroundColor: stairsAccess === 'yes' ? 'var(--color-latte-soft)' : 'white',
              transition: 'all 0.2s ease',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <input
                type="radio"
                name="stairs"
                value="yes"
                checked={stairsAccess === 'yes'}
                onChange={(e) => setStairsAccess('yes')}
                style={{ margin: 0, cursor: 'pointer' }}
              />
              Yes
            </label>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 20px', 
              border: `2px solid ${stairsAccess === 'no' ? 'var(--color-coffee)' : 'var(--color-latte)'}`, 
              borderRadius: '8px', 
              cursor: 'pointer', 
              flex: 1, 
              backgroundColor: stairsAccess === 'no' ? 'var(--color-latte-soft)' : 'white',
              transition: 'all 0.2s ease',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <input
                type="radio"
                name="stairs"
                value="no"
                checked={stairsAccess === 'no'}
                onChange={(e) => setStairsAccess('no')}
                style={{ margin: 0, cursor: 'pointer' }}
              />
              No
            </label>
          </div>
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
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
          <Link href={`/booking/configure?${searchParams.toString()}`}>
            <button className="button-secondary" style={{ padding: '16px 32px', fontSize: '1rem' }}>
              ← Back
            </button>
          </Link>
          <button
            onClick={handleContinue}
            disabled={!isFormValid}
            className="button-primary"
            style={{
              padding: '16px 48px',
              fontSize: '1.125rem',
              opacity: isFormValid ? 1 : 0.5,
              cursor: isFormValid ? 'pointer' : 'not-allowed'
            }}
          >
            Continue to Payment →
          </button>
        </div>
      </div>
    </div>
  );
}
