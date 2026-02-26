'use client';

import { Layers, CheckCircle2, DollarSign, AlertCircle } from 'lucide-react';

type IconType = 'layers' | 'check-circle' | 'dollar' | 'alert-circle';

const iconMap = {
  layers: Layers,
  'check-circle': CheckCircle2,
  dollar: DollarSign,
  'alert-circle': AlertCircle,
};

type StatsCardProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: 'default' | 'success' | 'revenue' | 'warning';
  icon?: IconType;
};

const toneStyles = {
  default: {
    bg: 'var(--color-white)',
    iconBg: 'var(--color-gray-100)',
    iconColor: 'var(--color-gray-600)',
    valueColor: 'var(--color-gray-900)',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  },
  success: {
    bg: '#F0FDF4',
    iconBg: 'rgba(22, 163, 74, 0.15)',
    iconColor: '#15803d',
    valueColor: '#166534',
    shadow: '0 1px 3px rgba(22, 163, 74, 0.08)',
  },
  revenue: {
    bg: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
    iconBg: 'rgba(99, 102, 241, 0.15)',
    iconColor: '#4f46e5',
    valueColor: '#3730a3',
    shadow: '0 1px 3px rgba(99, 102, 241, 0.08)',
  },
  warning: {
    bg: '#FFF7ED',
    iconBg: 'rgba(234, 88, 12, 0.15)',
    iconColor: '#c2410c',
    valueColor: '#9a3412',
    shadow: '0 1px 3px rgba(249, 115, 22, 0.08)',
  },
};

export function StatsCard({ label, value, helper, tone = 'default', icon: iconName }: StatsCardProps) {
  const styles = toneStyles[tone];
  const Icon = iconName ? iconMap[iconName] : null;

  return (
    <div
      className="admin-stat-card"
      style={{
        padding: '32px',
        borderRadius: '12px',
        background: styles.bg,
        boxShadow: styles.shadow,
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.01)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = styles.shadow;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-gray-500)',
            flex: 1,
          }}
        >
          {label}
        </span>
        {Icon && (
          <span
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: styles.iconBg,
              color: styles.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={18} strokeWidth={2.25} />
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: '40px',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: styles.valueColor,
        }}
      >
        {value}
      </div>
      {helper && (
        <div style={{ fontSize: '13px', color: 'var(--color-gray-500)', lineHeight: 1.4, marginTop: 'auto' }}>
          {helper}
        </div>
      )}
    </div>
  );
}
