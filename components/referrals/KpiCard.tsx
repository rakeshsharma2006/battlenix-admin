// components/referrals/KpiCard.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

import { ADMIN_COLORS } from '@/lib/admin-utils';

type KpiCardProps = {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  highlight?: boolean;
};

function useAnimatedNumber(target: number, duration = 800): number {
  const [current, setCurrent] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = current;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      }
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
}

export default function KpiCard({ title, value, prefix = '', suffix = '', loading = false, highlight = false }: KpiCardProps) {
  const animatedValue = useAnimatedNumber(value);

  if (loading) {
    return (
      <div
        style={{
          background: ADMIN_COLORS.bgCard,
          border: `1px solid ${ADMIN_COLORS.border}`,
          borderRadius: 16,
          padding: '20px 20px 18px',
          minHeight: 100,
        }}
      >
        <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
          <div
            className="animate-pulse"
            style={{
              width: '55%',
              height: 12,
              borderRadius: 6,
              background: ADMIN_COLORS.bgElevated,
            }}
          />
          <div
            className="animate-pulse"
            style={{
              width: '70%',
              height: 28,
              borderRadius: 8,
              background: ADMIN_COLORS.bgElevated,
            }}
          />
        </div>
      </div>
    );
  }

  const formattedValue = animatedValue.toLocaleString('en-IN');

  return (
    <div
      style={{
        background: highlight
          ? 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))'
          : ADMIN_COLORS.bgCard,
        border: `1px solid ${highlight ? 'rgba(245,158,11,0.25)' : ADMIN_COLORS.border}`,
        borderRadius: 16,
        padding: '20px 20px 18px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        minHeight: 100,
      }}
    >
      <div className="flex" style={{ flexDirection: 'column', gap: 8 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: ADMIN_COLORS.textSecondary,
          }}
        >
          {title}
        </span>
        <strong
          style={{
            fontSize: 26,
            fontWeight: 700,
            lineHeight: 1.2,
            color: highlight ? '#F59E0B' : ADMIN_COLORS.textPrimary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {prefix}{formattedValue}{suffix}
        </strong>
      </div>
    </div>
  );
}
