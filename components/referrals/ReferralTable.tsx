// components/referrals/ReferralTable.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Copy, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

import { ADMIN_COLORS, formatCurrency, formatDate } from '@/lib/admin-utils';
import { getExportUrl } from '@/lib/referral-api';
import type { ReferralCode, Platform } from '@/types/referral';

type ReferralTableProps = {
  data: ReferralCode[];
  loading: boolean;
  onViewDetail: (r: ReferralCode) => void;
  onEdit: (r: ReferralCode) => void;
  onShowQr: (r: ReferralCode) => void;
  onToggle: (r: ReferralCode) => void;
  onMarkPaid: (r: ReferralCode) => void;
};

const PLATFORM_COLORS: Record<Platform, { bg: string; border: string; text: string }> = {
  YOUTUBE: { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)', text: '#EF4444' },
  INSTAGRAM: { bg: 'rgba(236,72,153,0.10)', border: 'rgba(236,72,153,0.25)', text: '#EC4899' },
  TELEGRAM: { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.25)', text: '#3B82F6' },
  DISCORD: { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.25)', text: '#6366F1' },
  OTHER: { bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.25)', text: '#94A3B8' },
};

const ROWS_PER_PAGE = 10;

function ActionMenu({
  referral,
  onViewDetail,
  onEdit,
  onShowQr,
  onToggle,
  onMarkPaid,
}: {
  referral: ReferralCode;
  onViewDetail: (r: ReferralCode) => void;
  onEdit: (r: ReferralCode) => void;
  onShowQr: (r: ReferralCode) => void;
  onToggle: (r: ReferralCode) => void;
  onMarkPaid: (r: ReferralCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const copyLink = () => {
    const link = `${window.location.origin}/r/${referral.code}`;
    navigator.clipboard.writeText(link).then(() => toast.success('Tracking link copied!'));
    setOpen(false);
  };

  const exportCsv = () => {
    window.open(getExportUrl(referral._id), '_blank');
    setOpen(false);
  };

  const actions = [
    { label: '📋 View Details', fn: () => { onViewDetail(referral); setOpen(false); } },
    { label: '✏️ Edit', fn: () => { onEdit(referral); setOpen(false); } },
    { label: '📱 Show QR', fn: () => { onShowQr(referral); setOpen(false); } },
    { label: '🔗 Copy Tracking Link', fn: copyLink },
    { label: '📥 Export CSV', fn: exportCsv },
    {
      label: referral.isActive ? '🔴 Deactivate' : '🟢 Activate',
      fn: () => { onToggle(referral); setOpen(false); },
    },
    { label: '💰 Mark Paid', fn: () => { onMarkPaid(referral); setOpen(false); } },
  ];

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="cursor-pointer"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          border: `1px solid ${ADMIN_COLORS.border}`,
          background: 'transparent',
          color: ADMIN_COLORS.textSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 36,
            zIndex: 50,
            minWidth: 200,
            background: ADMIN_COLORS.bgCard,
            border: `1px solid ${ADMIN_COLORS.border}`,
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.fn}
              className="cursor-pointer"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                border: 'none',
                background: 'transparent',
                color: ADMIN_COLORS.textPrimary,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = ADMIN_COLORS.bgElevated; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReferralTable({
  data,
  loading,
  onViewDetail,
  onEdit,
  onShowQr,
  onToggle,
  onMarkPaid,
}: ReferralTableProps) {
  const [page, setPage] = useState(1);

  // Reset page when data changes (due to filtering)
  useEffect(() => setPage(1), [data.length]);

  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));
  const pageData = data.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success('Code copied!'));
  };

  if (loading) {
    return (
      <div
        style={{
          background: ADMIN_COLORS.bgCard,
          border: `1px solid ${ADMIN_COLORS.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              height: 48,
              borderRadius: 8,
              background: ADMIN_COLORS.bgElevated,
              marginBottom: i < 4 ? 8 : 0,
            }}
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          background: ADMIN_COLORS.bgCard,
          border: `1px solid ${ADMIN_COLORS.border}`,
          borderRadius: 16,
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: ADMIN_COLORS.textSecondary, fontSize: 15, margin: 0 }}>
          No referral codes found. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: ADMIN_COLORS.bgCard,
        border: `1px solid ${ADMIN_COLORS.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
              {['Creator', 'Code', 'Platform', 'Status', 'Clicks', 'Signups', 'Conv%', 'Matches', 'Revenue', 'Earned', 'Paid', 'Pending', 'Created', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 14px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: ADMIN_COLORS.textMuted,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((r) => {
              const convRate = r.totalClicks > 0
                ? ((r.totalSignups / r.totalClicks) * 100).toFixed(1)
                : '0.0';
              const pending = (r.totalCommissionEarned || 0) - (r.totalCommissionPaid || 0);
              const platformStyle = PLATFORM_COLORS[r.platform] || PLATFORM_COLORS.OTHER;

              return (
                <tr
                  key={r._id}
                  style={{
                    borderBottom: `1px solid ${ADMIN_COLORS.border}`,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = ADMIN_COLORS.bgElevated; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {/* Creator */}
                  <td style={{ padding: '12px 14px' }}>
                    <div className="flex" style={{ alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {r.creatorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex" style={{ flexDirection: 'column', gap: 1 }}>
                        <span style={{ color: ADMIN_COLORS.textPrimary, fontWeight: 600, fontSize: 13 }}>
                          {r.creatorName}
                        </span>
                        {r.channelName && (
                          <span style={{ color: ADMIN_COLORS.textMuted, fontSize: 11 }}>
                            {r.channelName}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Code */}
                  <td style={{ padding: '12px 14px' }}>
                    <div className="flex" style={{ alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 12,
                          fontWeight: 600,
                          background: ADMIN_COLORS.purpleGlow,
                          border: '1px solid rgba(124,58,237,0.2)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          color: ADMIN_COLORS.purple400,
                        }}
                      >
                        {r.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyCode(r.code)}
                        className="cursor-pointer"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: ADMIN_COLORS.textMuted,
                          padding: 2,
                          display: 'flex',
                          cursor: 'pointer',
                        }}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </td>

                  {/* Platform */}
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: platformStyle.bg,
                        border: `1px solid ${platformStyle.border}`,
                        color: platformStyle.text,
                        textTransform: 'capitalize',
                      }}
                    >
                      {r.platform.toLowerCase()}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: r.isActive ? 'rgba(16,185,129,0.10)' : 'rgba(148,163,184,0.10)',
                        border: `1px solid ${r.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(148,163,184,0.25)'}`,
                        color: r.isActive ? '#10B981' : '#94A3B8',
                      }}
                    >
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Clicks */}
                  <td style={{ padding: '12px 14px', color: ADMIN_COLORS.textSecondary, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                    {r.totalClicks.toLocaleString('en-IN')}
                  </td>

                  {/* Signups */}
                  <td style={{ padding: '12px 14px', color: ADMIN_COLORS.textSecondary, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                    {r.totalSignups.toLocaleString('en-IN')}
                  </td>

                  {/* Conv% */}
                  <td style={{ padding: '12px 14px', color: ADMIN_COLORS.textSecondary, fontSize: 13 }}>
                    {convRate}%
                  </td>

                  {/* Matches */}
                  <td style={{ padding: '12px 14px', color: ADMIN_COLORS.textSecondary, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                    {r.totalMatchesPlayed.toLocaleString('en-IN')}
                  </td>

                  {/* Revenue */}
                  <td style={{ padding: '12px 14px', color: ADMIN_COLORS.textPrimary, fontWeight: 600, fontSize: 13 }}>
                    {formatCurrency(r.totalRevenue)}
                  </td>

                  {/* Earned */}
                  <td style={{ padding: '12px 14px', color: ADMIN_COLORS.success, fontSize: 13, fontWeight: 600 }}>
                    {formatCurrency(r.totalCommissionEarned)}
                  </td>

                  {/* Paid */}
                  <td style={{ padding: '12px 14px', color: ADMIN_COLORS.textSecondary, fontSize: 13 }}>
                    {formatCurrency(r.totalCommissionPaid)}
                  </td>

                  {/* Pending */}
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
                    <span
                      style={{
                        color: pending > 0 ? '#F59E0B' : ADMIN_COLORS.textSecondary,
                        background: pending > 0 ? 'rgba(245,158,11,0.10)' : 'transparent',
                        padding: pending > 0 ? '2px 6px' : 0,
                        borderRadius: 4,
                      }}
                    >
                      {formatCurrency(pending)}
                    </span>
                  </td>

                  {/* Created */}
                  <td style={{ padding: '12px 14px', color: ADMIN_COLORS.textMuted, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {formatDate(r.createdAt)}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 14px' }}>
                    <ActionMenu
                      referral={r}
                      onViewDetail={onViewDetail}
                      onEdit={onEdit}
                      onShowQr={onShowQr}
                      onToggle={onToggle}
                      onMarkPaid={onMarkPaid}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className="flex"
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: `1px solid ${ADMIN_COLORS.border}`,
        }}
      >
        <span style={{ color: ADMIN_COLORS.textMuted, fontSize: 13 }}>
          Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, data.length)} of {data.length}
        </span>
        <div className="flex" style={{ gap: 6 }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="cursor-pointer"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${ADMIN_COLORS.border}`,
              background: 'transparent',
              color: page <= 1 ? ADMIN_COLORS.textMuted : ADMIN_COLORS.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: page <= 1 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              color: ADMIN_COLORS.textSecondary,
              fontSize: 13,
            }}
          >
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="cursor-pointer"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${ADMIN_COLORS.border}`,
              background: 'transparent',
              color: page >= totalPages ? ADMIN_COLORS.textMuted : ADMIN_COLORS.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: page >= totalPages ? 0.4 : 1,
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
