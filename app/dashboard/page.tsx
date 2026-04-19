// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Swords, TrendingUp, Users, Wallet, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

import DataTable, { type DataTableColumn } from '@/components/DataTable';
import MatchStatsChart from '@/components/MatchStatsChart';
import RevenueChart from '@/components/RevenueChart';
import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  ADMIN_COLORS,
  formatCurrency,
  formatDate,
  formatMatchSchedule,
  getAdminDisplayName,
  getErrorMessage,
} from '@/lib/admin-utils';
import type { DashboardStats } from '@/types';

type DashboardMatch = {
  _id: string;
  title: string;
  game: string;
  status: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  playersCount?: number;
  startTime?: string;
  createdAt: string;
};

type DashboardPayout = {
  _id: string;
  winnerUsername: string;
  winnerUpiId: string;
  amount: number;
  status: string;
  createdAt: string;
};

type DashboardResponse = {
  dashboard: {
    users: { total: number; banned: number; flagged: number };
    matches: { total: number; active: number; completed: number };
    revenue: { totalCollected: number };
    refunds: { pending: number };
    payouts?: { pending: number; paid: number };
  };
};

const EMPTY_STATS: DashboardStats = {
  totalPlayers: 0,
  activePlayers: 0,
  totalMatches: 0,
  liveMatches: 0,
  pendingWithdrawals: 0,
  totalPayouts: 0,
  revenue: 0,
  payouts: 0,
};

function getGreeting() {
  const hours = new Date().getHours();

  if (hours < 12) {
    return 'Good morning';
  }

  if (hours < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

export default function DashboardPage() {
  const { admin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [recentMatches, setRecentMatches] = useState<DashboardMatch[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<DashboardPayout[]>([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [matchesResponse, payoutsResponse, dashboardResponse, supportStatsResponse] = await Promise.all([
          api.get<{ matches: DashboardMatch[] }>('/proxy/matches'),
          api.get<{ payouts: DashboardPayout[] }>('/proxy/admin/payouts?status=PENDING&limit=10'),
          api.get<DashboardResponse>('/proxy/admin/dashboard').catch(() => null),
          api.get<{ openCount: number }>('/proxy/support/admin/stats').catch(() => null),
        ]);

        const matches = matchesResponse.data.matches ?? [];
        const payouts = payoutsResponse.data.payouts ?? [];
        const pending = payouts
          .filter((p) => p.status === 'PENDING')
          .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime());

        setRecentMatches(
          [...matches]
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
            .slice(0, 5)
        );
        setPendingPayouts(pending.slice(0, 5));
        setPendingAmount(pending.reduce((total, p) => total + (p.amount ?? 0), 0));

        if (supportStatsResponse?.data?.openCount) {
          setOpenTickets(supportStatsResponse.data.openCount);
        }

        const db = dashboardResponse?.data?.dashboard;
        if (db) {
          setStats({
            totalPlayers: db.users?.total ?? 0,
            activePlayers: db.users?.total ?? 0,
            totalMatches: db.matches?.total ?? 0,
            liveMatches: db.matches?.active ?? 0,
            pendingWithdrawals: 0,
            totalPayouts: db.payouts?.paid ?? 0,
            revenue: db.revenue?.totalCollected ?? 0,
            payouts: db.payouts?.pending ?? 0,
          });
        } else {
          setStats({
            totalPlayers: 0,
            activePlayers: 0,
            totalMatches: matches.length,
            liveMatches: matches.filter((m) => m.status === 'LIVE').length,
            pendingWithdrawals: 0,
            totalPayouts: 0,
            revenue: 0,
            payouts: pending.length,
          });
        }
      } catch (err) {
        const message = getErrorMessage(err, 'Unable to load dashboard data.');
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const matchColumns: DataTableColumn<DashboardMatch>[] = [
    {
      key: 'title',
      label: 'Title',
      render: (match) => (
        <span style={{ color: ADMIN_COLORS.textPrimary, fontWeight: 600 }}>{match.title}</span>
      ),
    },
    {
      key: 'game',
      label: 'Game',
      render: (match) => <span style={{ color: ADMIN_COLORS.textSecondary }}>{match.game}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (match) => <StatusBadge status={match.status} variant="match" />,
    },
    {
      key: 'entryFee',
      label: 'Entry Fee',
      render: (match) => <span>{formatCurrency(match.entryFee)}</span>,
    },
    {
      key: 'players',
      label: 'Players',
      render: (match) => <span>{`${match.playersCount ?? 0}/${match.maxPlayers}`}</span>,
    },
    {
      key: 'startTime',
      label: 'Date',
      render: (match) => (
        <span style={{ color: ADMIN_COLORS.textSecondary }}>{formatMatchSchedule(match.startTime)}</span>
      ),
    },
  ];

  const payoutColumns: DataTableColumn<DashboardPayout>[] = [
    {
      key: 'player',
      label: 'Player',
      render: (payout) => (
        <span style={{ color: ADMIN_COLORS.textPrimary, fontWeight: 600 }}>
          {payout.winnerUsername}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (payout) => (
        <span style={{ color: ADMIN_COLORS.textPrimary, fontWeight: 600 }}>
          {formatCurrency(payout.amount)}
        </span>
      ),
    },
    {
      key: 'upiId',
      label: 'UPI',
      render: (payout) => (
        <span style={{ color: ADMIN_COLORS.textSecondary, fontFamily: 'monospace' }}>
          {payout.winnerUpiId}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (payout) => (
        <span style={{ color: ADMIN_COLORS.textSecondary }}>
          {formatDate(payout.createdAt, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="flex" style={{ flexDirection: 'column', gap: 24 }}>
      {error ? (
        <div
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.24)',
            borderRadius: 12,
            padding: '12px 16px',
            color: ADMIN_COLORS.error,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : null}

      <section
        style={{
          background: 'linear-gradient(135deg, #13131E 0%, #1A1A28 100%)',
          border: `1px solid ${ADMIN_COLORS.borderActive}`,
          borderRadius: 12,
          padding: '20px 24px',
        }}
      >
        <div className="dashboard-hero">
          <div className="flex" style={{ flexDirection: 'column', gap: 10 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                color: ADMIN_COLORS.textPrimary,
              }}
            >
              {`${getGreeting()}, ${getAdminDisplayName(admin)}! \u{1F44B}`}
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: ADMIN_COLORS.textSecondary }}>
              Here&apos;s what&apos;s happening with BattleNix today.
            </p>
          </div>

          <Link
            href="/matches/create"
            className="flex items-center gap-2"
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              fontWeight: 500,
              fontSize: 14,
              color: '#FFFFFF',
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={16} />
            New Match
          </Link>
        </div>
      </section>

      <section className="dashboard-stats-grid">
        <StatsCard
          title="Total Players"
          value={stats.totalPlayers}
          icon={Users}
          change="+12% this week"
          changeType="up"
          loading={loading}
        />
        <StatsCard
          title="Live Matches"
          value={stats.liveMatches}
          icon={Swords}
          change="3 ending soon"
          changeType="neutral"
          loading={loading}
        />
        <StatsCard
          title="Pending Payouts"
          value={stats.payouts}
          icon={Wallet}
          change={formatCurrency(pendingAmount)}
          changeType="down"
          loading={loading}
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.revenue)}
          icon={TrendingUp}
          change="+8% this month"
          changeType="up"
          loading={loading}
        />
        <Link href="/help-center?status=OPEN" style={{ textDecoration: 'none', display: 'flex' }}>
          <StatsCard
            title="Open Support Tickets"
            value={openTickets}
            icon={MessageSquare}
            change="Needs attention"
            changeType="down"
            loading={loading}
          />
        </Link>
      </section>

      <section className="dashboard-charts-grid">
        <RevenueChart />
        <MatchStatsChart />
      </section>

      <section className="dashboard-panels">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div className="flex" style={{ flexDirection: 'column', gap: 4 }}>
              <h2 style={{ margin: 0, color: ADMIN_COLORS.textPrimary, fontSize: 18, fontWeight: 700 }}>
                Recent Matches
              </h2>
              <p style={{ margin: 0, color: ADMIN_COLORS.textSecondary, fontSize: 13 }}>
                Latest match activity and scheduling updates.
              </p>
            </div>
          </div>
          <DataTable
            columns={matchColumns}
            data={recentMatches}
            loading={loading}
            emptyMessage="No recent matches available."
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div className="flex" style={{ flexDirection: 'column', gap: 4 }}>
              <h2 style={{ margin: 0, color: ADMIN_COLORS.textPrimary, fontSize: 18, fontWeight: 700 }}>
                Pending Payouts
              </h2>
              <p style={{ margin: 0, color: ADMIN_COLORS.textSecondary, fontSize: 13 }}>
                Latest prize payouts awaiting tracking.
              </p>
            </div>
            <Link
              href="/payouts"
              style={{
                color: ADMIN_COLORS.purple400,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              View all
            </Link>
          </div>
          <DataTable
            columns={payoutColumns}
            data={pendingPayouts}
            loading={loading}
            emptyMessage="No pending payouts right now."
          />
        </div>
      </section>

      <style jsx>{`
        .dashboard-stats-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .dashboard-charts-grid {
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .dashboard-panels {
          display: grid;
          gap: 24px;
          grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        }

        .dashboard-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (max-width: 1200px) {
          .dashboard-charts-grid,
          .dashboard-panels {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-stats-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-hero {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
