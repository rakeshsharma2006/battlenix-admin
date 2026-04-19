// components/MatchStatsChart.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ADMIN_COLORS } from '@/lib/admin-utils';

interface MatchRecord {
  status?: string;
}

interface MatchStatusData {
  status: string;
  count: number;
}

const STATUS_ORDER = ['UPCOMING', 'READY', 'LIVE', 'COMPLETED', 'CANCELLED'] as const;

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: ADMIN_COLORS.textSecondary,
  READY: ADMIN_COLORS.warning,
  LIVE: ADMIN_COLORS.success,
  COMPLETED: ADMIN_COLORS.purple600,
  CANCELLED: ADMIN_COLORS.error,
};

export default function MatchStatsChart() {
  const [data, setData] = useState<MatchStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/proxy/admin/matches?limit=50', {
          credentials: 'include',
        });
        const json = await response.json();
        const matches = (json.matches ?? []) as MatchRecord[];

        const statusCount: Record<string, number> = {
          UPCOMING: 0,
          READY: 0,
          LIVE: 0,
          COMPLETED: 0,
          CANCELLED: 0,
        };

        matches.forEach((match) => {
          const normalized = match.status?.toUpperCase();

          if (normalized && statusCount[normalized] !== undefined) {
            statusCount[normalized] += 1;
          }
        });

        setData(STATUS_ORDER.map((status) => ({ status, count: statusCount[status] })));
      } catch {
        setData(STATUS_ORDER.map((status) => ({ status, count: 0 })));
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
      <div className="mb-6">
        <h3 style={{ margin: 0, color: ADMIN_COLORS.textPrimary, fontWeight: 600, fontSize: 18 }}>
          Match Distribution
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: ADMIN_COLORS.textSecondary }}>
          By status
        </p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_COLORS.border} />
          <XAxis
            dataKey="status"
            tick={{ fill: ADMIN_COLORS.textMuted, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: ADMIN_COLORS.textMuted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: ADMIN_COLORS.bgElevated,
              border: `1px solid ${ADMIN_COLORS.border}`,
              borderRadius: 8,
              color: ADMIN_COLORS.textPrimary,
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? ADMIN_COLORS.purple600}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
