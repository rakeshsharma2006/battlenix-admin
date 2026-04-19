// components/StatsCard.tsx
'use client';

import type { LucideIcon } from 'lucide-react';

import { ADMIN_COLORS } from '@/lib/admin-utils';

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  loading?: boolean;
};

const CHANGE_META = {
  up: { symbol: '↑', color: ADMIN_COLORS.success },
  down: { symbol: '↓', color: ADMIN_COLORS.error },
  neutral: { symbol: '—', color: ADMIN_COLORS.textSecondary },
} as const;

export default function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  loading = false,
}: StatsCardProps) {
  return (
    <div
      style={{
        background: ADMIN_COLORS.bgCard,
        border: `1px solid ${ADMIN_COLORS.border}`,
        borderRadius: 12,
        padding: 20,
      }}
    >
      {loading ? (
        <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
          <div
            className="animate-pulse"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: ADMIN_COLORS.bgElevated,
            }}
          />
          <div
            className="animate-pulse"
            style={{
              width: '45%',
              height: 10,
              borderRadius: 6,
              background: ADMIN_COLORS.bgElevated,
            }}
          />
          <div
            className="animate-pulse"
            style={{
              width: '72%',
              height: 24,
              borderRadius: 6,
              background: ADMIN_COLORS.bgElevated,
            }}
          />
          <div
            className="animate-pulse"
            style={{
              width: '56%',
              height: 12,
              borderRadius: 6,
              background: ADMIN_COLORS.bgElevated,
            }}
          />
        </div>
      ) : (
        <div className="flex" style={{ flexDirection: 'column', gap: 16 }}>
          <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div
              className="flex"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                background: ADMIN_COLORS.purpleGlow,
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <Icon size={18} color={ADMIN_COLORS.purple400} />
            </div>
          </div>

          <div className="flex" style={{ flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: ADMIN_COLORS.textSecondary,
              }}
            >
              {title}
            </span>
            <strong
              style={{
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.2,
                color: ADMIN_COLORS.textPrimary,
              }}
            >
              {value}
            </strong>
          </div>

          {change ? (
            <span
              style={{
                fontSize: 13,
                color: CHANGE_META[changeType].color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{CHANGE_META[changeType].symbol}</span>
              <span>{change}</span>
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
