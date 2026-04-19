// components/StatusBadge.tsx
'use client';

import { ADMIN_COLORS } from '@/lib/admin-utils';

type StatusBadgeProps = {
  status: string;
  variant?: 'match' | 'withdrawal' | 'payment' | 'player';
};

const STATUS_STYLES = {
  match: {
    live: {
      background: 'rgba(16,185,129,0.12)',
      borderColor: 'rgba(16,185,129,0.24)',
      color: ADMIN_COLORS.success,
    },
    ready: {
      background: 'rgba(245,158,11,0.12)',
      borderColor: 'rgba(245,158,11,0.24)',
      color: ADMIN_COLORS.warning,
    },
    upcoming: {
      background: 'rgba(124,58,237,0.12)',
      borderColor: 'rgba(124,58,237,0.24)',
      color: ADMIN_COLORS.purple400,
    },
    completed: {
      background: 'rgba(148,163,184,0.12)',
      borderColor: 'rgba(148,163,184,0.24)',
      color: ADMIN_COLORS.textSecondary,
    },
    cancelled: {
      background: 'rgba(239,68,68,0.12)',
      borderColor: 'rgba(239,68,68,0.24)',
      color: ADMIN_COLORS.error,
    },
    full: {
      background: 'rgba(245,158,11,0.12)',
      borderColor: 'rgba(245,158,11,0.24)',
      color: ADMIN_COLORS.warning,
    },
    expired: {
      background: 'rgba(148,163,184,0.12)',
      borderColor: 'rgba(148,163,184,0.24)',
      color: ADMIN_COLORS.textSecondary,
    },
  },
  withdrawal: {
    pending: {
      background: 'rgba(245,158,11,0.12)',
      borderColor: 'rgba(245,158,11,0.24)',
      color: ADMIN_COLORS.warning,
    },
    approved: {
      background: 'rgba(16,185,129,0.12)',
      borderColor: 'rgba(16,185,129,0.24)',
      color: ADMIN_COLORS.success,
    },
    rejected: {
      background: 'rgba(239,68,68,0.12)',
      borderColor: 'rgba(239,68,68,0.24)',
      color: ADMIN_COLORS.error,
    },
  },
  payment: {
    success: {
      background: 'rgba(16,185,129,0.12)',
      borderColor: 'rgba(16,185,129,0.24)',
      color: ADMIN_COLORS.success,
    },
    failed: {
      background: 'rgba(239,68,68,0.12)',
      borderColor: 'rgba(239,68,68,0.24)',
      color: ADMIN_COLORS.error,
    },
    pending: {
      background: 'rgba(245,158,11,0.12)',
      borderColor: 'rgba(245,158,11,0.24)',
      color: ADMIN_COLORS.warning,
    },
  },
  player: {
    banned: {
      background: 'rgba(239,68,68,0.12)',
      borderColor: 'rgba(239,68,68,0.24)',
      color: ADMIN_COLORS.error,
    },
    active: {
      background: 'rgba(16,185,129,0.12)',
      borderColor: 'rgba(16,185,129,0.24)',
      color: ADMIN_COLORS.success,
    },
  },
} as const;

export default function StatusBadge({
  status,
  variant = 'match',
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const paletteMap = STATUS_STYLES[variant] as Record<
    string,
    { background: string; borderColor: string; color: string }
  >;
  const palette = paletteMap[normalizedStatus] ?? {
    background: 'rgba(148,163,184,0.12)',
    borderColor: 'rgba(148,163,184,0.24)',
    color: ADMIN_COLORS.textSecondary,
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 10px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        background: palette.background,
        border: `1px solid ${palette.borderColor}`,
        color: palette.color,
        whiteSpace: 'nowrap',
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
