// components/RevenueChart.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ADMIN_COLORS } from '@/lib/admin-utils';

interface PaymentRecord {
  amount?: number;
  createdAt?: string;
}

interface DailyData {
  date: string;
  revenue: number;
  payments: number;
  sortValue: number;
}

export default function RevenueChart() {
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'revenue' | 'payments'>('revenue');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/proxy/admin/payments?limit=100&status=SUCCESS', {
          credentials: 'include',
        });
        const json = await response.json();
        const payments = (json.payments ?? []) as PaymentRecord[];

        const grouped: Record<string, DailyData> = {};

        payments.forEach((payment) => {
          if (!payment.createdAt) {
            return;
          }

          const createdAt = new Date(payment.createdAt);
          const dayKey = createdAt.toISOString().slice(0, 10);

          if (!grouped[dayKey]) {
            grouped[dayKey] = {
              date: createdAt.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
              }),
              revenue: 0,
              payments: 0,
              sortValue: createdAt.getTime(),
            };
          }

          grouped[dayKey].revenue += payment.amount ?? 0;
          grouped[dayKey].payments += 1;
        });

        const chartData = Object.values(grouped)
          .sort((left, right) => left.sortValue - right.sortValue)
          .slice(-14);

        setData(chartData);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div
        className="flex"
        style={{
          height: 256,
          alignItems: 'center',
          justifyContent: 'center',
          background: ADMIN_COLORS.bgCard,
          border: `1px solid ${ADMIN_COLORS.border}`,
          borderRadius: 16,
        }}
      >
        <div
          className="animate-spin"
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: `2px solid ${ADMIN_COLORS.purple500}`,
            borderTopColor: 'transparent',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: ADMIN_COLORS.bgCard,
        border: `1px solid ${ADMIN_COLORS.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 style={{ margin: 0, color: ADMIN_COLORS.textPrimary, fontWeight: 600, fontSize: 18 }}>
            Revenue Overview
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: ADMIN_COLORS.textSecondary }}>
            Last 14 days
          </p>
        </div>
        <div className="flex gap-2">
          {(['revenue', 'payments'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className="transition"
              style={{
                padding: '6px 12px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 500,
                background: view === value ? ADMIN_COLORS.purple600 : ADMIN_COLORS.bgElevated,
                color: view === value ? '#FFFFFF' : ADMIN_COLORS.textSecondary,
                border: `1px solid ${view === value ? ADMIN_COLORS.purple600 : ADMIN_COLORS.border}`,
                cursor: 'pointer',
              }}
            >
              {value === 'revenue' ? '\u20B9 Revenue' : 'Payments'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ADMIN_COLORS.purple600} stopOpacity={0.3} />
              <stop offset="95%" stopColor={ADMIN_COLORS.purple600} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_COLORS.border} />
          <XAxis
            dataKey="date"
            tick={{ fill: ADMIN_COLORS.textMuted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: ADMIN_COLORS.textMuted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => (view === 'revenue' ? `\u20B9${value}` : `${value}`)}
          />
          <Tooltip
            contentStyle={{
              background: ADMIN_COLORS.bgElevated,
              border: `1px solid ${ADMIN_COLORS.border}`,
              borderRadius: 8,
              color: ADMIN_COLORS.textPrimary,
            }}
            formatter={(value) => {
              const rawValue = Array.isArray(value) ? value[0] : value;
              const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);

              return [
                view === 'revenue' ? `\u20B9${numericValue}` : `${numericValue}`,
                view === 'revenue' ? 'Revenue' : 'Payments',
              ];
            }}
          />
          <Area
            type="monotone"
            dataKey={view}
            stroke={ADMIN_COLORS.purple600}
            strokeWidth={2}
            fill="url(#revenue-gradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
