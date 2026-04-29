// app/referrals/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

import AdminShell from '@/components/AdminShell';
import KpiCard from '@/components/referrals/KpiCard';
import ReferralTable from '@/components/referrals/ReferralTable';
import CreateReferralModal from '@/components/referrals/CreateReferralModal';
import EditReferralModal from '@/components/referrals/EditReferralModal';
import DetailDrawer from '@/components/referrals/DetailDrawer';
import QrModal from '@/components/referrals/QrModal';
import MarkPaidModal from '@/components/referrals/MarkPaidModal';
import FraudWidget from '@/components/referrals/FraudWidget';
import { ADMIN_COLORS, formatCurrency, getErrorMessage } from '@/lib/admin-utils';
import { fetchAllReferrals, toggleReferral } from '@/lib/referral-api';
import type {
  ReferralCode,
  ReferralSummary,
  ReferralFilterStatus,
  ReferralFilterPlatform,
  ReferralSortBy,
  Platform,
} from '@/types/referral';

const EMPTY_SUMMARY: ReferralSummary = {
  totalCodes: 0, activeCodes: 0, totalClicks: 0, totalSignups: 0,
  totalRevenue: 0, totalCommissionEarned: 0, totalCommissionPaid: 0,
  totalPendingCommission: 0, conversionRate: '0%',
};

export default function ReferralsPage() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [summary, setSummary] = useState<ReferralSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReferralFilterStatus>('all');
  const [platformFilter, setPlatformFilter] = useState<ReferralFilterPlatform>('all');
  const [sortBy, setSortBy] = useState<ReferralSortBy>('newest');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ReferralCode | null>(null);
  const [detailTarget, setDetailTarget] = useState<ReferralCode | null>(null);
  const [qrTarget, setQrTarget] = useState<ReferralCode | null>(null);
  const [paidTarget, setPaidTarget] = useState<ReferralCode | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const resp = await fetchAllReferrals(1, 500);
      setCodes(resp.codes);
      setSummary(resp.summary);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load referrals.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = [...codes];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.creatorName.toLowerCase().includes(q)
          || c.code.toLowerCase().includes(q)
          || (c.channelName && c.channelName.toLowerCase().includes(q))
      );
    }

    if (statusFilter === 'active') result = result.filter((c) => c.isActive);
    if (statusFilter === 'inactive') result = result.filter((c) => !c.isActive);

    if (platformFilter !== 'all') {
      result = result.filter((c) => c.platform === platformFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'revenue': return b.totalRevenue - a.totalRevenue;
        case 'signups': return b.totalSignups - a.totalSignups;
        case 'commission': return b.totalCommissionEarned - a.totalCommissionEarned;
        case 'conversion': {
          const rA = a.totalClicks > 0 ? a.totalSignups / a.totalClicks : 0;
          const rB = b.totalClicks > 0 ? b.totalSignups / b.totalClicks : 0;
          return rB - rA;
        }
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [codes, search, statusFilter, platformFilter, sortBy]);

  // Charts data
  const topByRevenue = useMemo(() =>
    [...codes].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10)
      .map((c) => ({ name: c.creatorName.slice(0, 12), revenue: c.totalRevenue })),
    [codes]
  );

  const topByConversion = useMemo(() =>
    [...codes]
      .filter((c) => c.totalClicks > 0)
      .sort((a, b) => (b.totalSignups / b.totalClicks) - (a.totalSignups / a.totalClicks))
      .slice(0, 10)
      .map((c) => ({
        name: c.creatorName.slice(0, 12),
        rate: Number(((c.totalSignups / c.totalClicks) * 100).toFixed(1)),
      })),
    [codes]
  );

  // Handle toggle with confirm
  const handleToggle = async (r: ReferralCode) => {
    if (r.isActive) {
      const ok = window.confirm(`Deactivate code "${r.code}"? It will stop tracking.`);
      if (!ok) return;
    }
    try {
      await toggleReferral(r._id);
      toast.success(`Code ${r.isActive ? 'deactivated' : 'activated'}.`);
      void loadData(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Toggle failed.'));
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPlatformFilter('all');
    setSortBy('newest');
  };

  const convRateNum = summary.totalClicks > 0
    ? ((summary.totalSignups / summary.totalClicks) * 100)
    : 0;

  const selectStyle: React.CSSProperties = {
    height: 40, padding: '0 12px', borderRadius: 10,
    border: `1px solid ${ADMIN_COLORS.border}`, background: ADMIN_COLORS.bgElevated,
    color: ADMIN_COLORS.textPrimary, fontSize: 13, outline: 'none',
  };

  const chartCard: React.CSSProperties = {
    background: ADMIN_COLORS.bgCard,
    border: `1px solid ${ADMIN_COLORS.border}`,
    borderRadius: 16, padding: 20,
  };

  return (
    <AdminShell>
      <div className="flex" style={{ flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>
              Referral &amp; Creator Marketing
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: ADMIN_COLORS.textSecondary }}>
              Track creators, commissions, conversions and payouts.
            </p>
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <button
              type="button"
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="cursor-pointer"
              style={{
                height: 40, padding: '0 16px', borderRadius: 10,
                border: `1px solid ${ADMIN_COLORS.border}`, background: 'transparent',
                color: ADMIN_COLORS.textSecondary, fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="cursor-pointer"
              style={{
                height: 40, padding: '0 20px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
                color: '#fff', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Plus size={14} /> New Creator Code
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="referral-kpi-grid">
          <KpiCard title="Active Codes" value={summary.activeCodes} loading={loading} />
          <KpiCard title="Total Clicks" value={summary.totalClicks} loading={loading} />
          <KpiCard title="Total Signups" value={summary.totalSignups} loading={loading} />
          <KpiCard title="Click → Signup %" value={Math.round(convRateNum)} suffix="%" loading={loading} />
          <KpiCard title="Total Revenue" value={summary.totalRevenue} prefix="₹" loading={loading} />
          <KpiCard title="Commission Earned" value={summary.totalCommissionEarned} prefix="₹" loading={loading} />
          <KpiCard title="Pending Commission" value={summary.totalPendingCommission} prefix="₹" loading={loading} highlight />
          <KpiCard title="Paid Out" value={summary.totalCommissionPaid} prefix="₹" loading={loading} />
        </div>

        {/* Charts */}
        <div className="referral-charts-grid">
          <div style={chartCard}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>Top 10 Creators by Revenue</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topByRevenue} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_COLORS.border} />
                <XAxis type="number" tick={{ fontSize: 11, fill: ADMIN_COLORS.textMuted }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: ADMIN_COLORS.textSecondary }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ background: ADMIN_COLORS.bgCard, border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v: any) => formatCurrency(Number(v))} />
                <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={chartCard}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>Top 10 by Conversion Rate (%)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topByConversion} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_COLORS.border} />
                <XAxis type="number" tick={{ fontSize: 11, fill: ADMIN_COLORS.textMuted }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: ADMIN_COLORS.textSecondary }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ background: ADMIN_COLORS.bgCard, border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v: any) => `${v}%`} />
                <Bar dataKey="rate" fill="#10B981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="referral-filter-bar" style={{ background: ADMIN_COLORS.bgCard, border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 16, padding: '14px 20px' }}>
          <input
            type="text"
            placeholder="Search by creator or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...selectStyle, flex: 1, minWidth: 180 }}
          />
          <select style={selectStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ReferralFilterStatus)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select style={selectStyle} value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as ReferralFilterPlatform)}>
            <option value="all">All Platforms</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TELEGRAM">Telegram</option>
            <option value="DISCORD">Discord</option>
            <option value="OTHER">Other</option>
          </select>
          <select style={selectStyle} value={sortBy} onChange={(e) => setSortBy(e.target.value as ReferralSortBy)}>
            <option value="newest">Newest</option>
            <option value="revenue">Revenue</option>
            <option value="signups">Signups</option>
            <option value="commission">Commission</option>
            <option value="conversion">Best Conversion</option>
          </select>
          <button type="button" onClick={resetFilters} className="cursor-pointer" style={{ ...selectStyle, background: 'transparent', cursor: 'pointer', fontWeight: 600, color: ADMIN_COLORS.purple400, border: `1px solid ${ADMIN_COLORS.border}`, whiteSpace: 'nowrap' }}>
            Reset
          </button>
        </div>

        {/* Table + Fraud Widget */}
        <div className="referral-main-grid">
          <ReferralTable
            data={filtered}
            loading={loading}
            onViewDetail={(r) => setDetailTarget(r)}
            onEdit={(r) => setEditTarget(r)}
            onShowQr={(r) => setQrTarget(r)}
            onToggle={(r) => void handleToggle(r)}
            onMarkPaid={(r) => setPaidTarget(r)}
          />
          <FraudWidget codes={codes} loading={loading} />
        </div>
      </div>

      {/* Modals */}
      <CreateReferralModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => void loadData(true)} />
      <EditReferralModal open={!!editTarget} referral={editTarget} onClose={() => setEditTarget(null)} onUpdated={() => void loadData(true)} />
      <DetailDrawer open={!!detailTarget} referral={detailTarget} onClose={() => setDetailTarget(null)} />
      <QrModal open={!!qrTarget} referral={qrTarget} onClose={() => setQrTarget(null)} />
      <MarkPaidModal open={!!paidTarget} referral={paidTarget} onClose={() => setPaidTarget(null)} onPaid={() => void loadData(true)} />

      <style jsx>{`
        .referral-kpi-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        .referral-charts-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .referral-filter-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .referral-main-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
        }
        @media (max-width: 1200px) {
          .referral-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .referral-charts-grid { grid-template-columns: 1fr; }
          .referral-main-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .referral-kpi-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </AdminShell>
  );
}
