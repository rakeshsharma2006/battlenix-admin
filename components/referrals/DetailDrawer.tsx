// components/referrals/DetailDrawer.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

import { ADMIN_COLORS, formatCurrency, formatDate, getErrorMessage } from '@/lib/admin-utils';
import { fetchReferralDetail } from '@/lib/referral-api';
import type { ReferralCode, ReferralDetailResponse } from '@/types/referral';

type DetailDrawerProps = {
  open: boolean;
  referral: ReferralCode | null;
  onClose: () => void;
};

const ROWS = 10;

export default function DetailDrawer({ open, referral, onClose }: DetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ReferralDetailResponse | null>(null);
  const [userPage, setUserPage] = useState(1);

  useEffect(() => {
    if (!open || !referral) { setDetail(null); return; }
    setLoading(true);
    setUserPage(1);
    fetchReferralDetail(referral._id)
      .then(setDetail)
      .catch((e) => toast.error(getErrorMessage(e, 'Failed to load details.')))
      .finally(() => setLoading(false));
  }, [open, referral]);

  if (!open || !referral) return null;

  const r = detail?.referral ?? referral;
  const users = detail?.referredUsers ?? [];
  const payouts = detail?.payouts ?? [];
  const trend = detail?.clickTrend ?? [];
  const analytics = detail?.analytics;
  const pending = (r.totalCommissionEarned || 0) - (r.totalCommissionPaid || 0);

  const userPages = Math.max(1, Math.ceil(users.length / ROWS));
  const pageUsers = users.slice((userPage - 1) * ROWS, userPage * ROWS);

  const sectionStyle: React.CSSProperties = {
    background: ADMIN_COLORS.bgElevated,
    border: `1px solid ${ADMIN_COLORS.border}`,
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: ADMIN_COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  const valStyle: React.CSSProperties = {
    fontSize: 14, fontWeight: 600, color: ADMIN_COLORS.textPrimary,
  };

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      <aside
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 95,
          width: '100%', maxWidth: 640, background: ADMIN_COLORS.bgSurface,
          borderLeft: `1px solid ${ADMIN_COLORS.border}`,
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${ADMIN_COLORS.border}`, flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>
            {r.creatorName} — {r.code}
          </h2>
          <button type="button" onClick={onClose} className="cursor-pointer" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${ADMIN_COLORS.border}`, background: 'transparent', color: ADMIN_COLORS.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            {[1,2,3].map((i) => (
              <div key={i} className="animate-pulse" style={{ height: 80, borderRadius: 14, background: ADMIN_COLORS.bgElevated, marginBottom: 16 }} />
            ))}
          </div>
        ) : (
          <div style={{ padding: 24, flex: 1 }}>
            {/* A — Creator Profile */}
            <div style={sectionStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>Creator Profile</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><span style={labelStyle}>Name</span><p style={{ ...valStyle, margin: '2px 0 0' }}>{r.creatorName}</p></div>
                <div><span style={labelStyle}>Channel</span><p style={{ ...valStyle, margin: '2px 0 0' }}>{r.channelName || '—'}</p></div>
                <div><span style={labelStyle}>Platform</span><p style={{ ...valStyle, margin: '2px 0 0' }}>{r.platform}</p></div>
                <div><span style={labelStyle}>Code</span><p style={{ ...valStyle, margin: '2px 0 0', fontFamily: 'monospace' }}>{r.code}</p></div>
                <div><span style={labelStyle}>Commission</span><p style={{ ...valStyle, margin: '2px 0 0' }}>{r.commissionModel.replace(/_/g, ' ')}</p></div>
                <div><span style={labelStyle}>Created</span><p style={{ ...valStyle, margin: '2px 0 0' }}>{formatDate(r.createdAt)}</p></div>
              </div>
            </div>

            {/* B — Performance Stats */}
            <div style={sectionStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>Performance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { l: 'Clicks', v: r.totalClicks.toLocaleString('en-IN') },
                  { l: 'Signups', v: r.totalSignups.toLocaleString('en-IN') },
                  { l: 'First Matches', v: r.totalFirstMatches.toLocaleString('en-IN') },
                  { l: 'Matches', v: r.totalMatchesPlayed.toLocaleString('en-IN') },
                  { l: 'Revenue', v: formatCurrency(r.totalRevenue) },
                  { l: 'Earned', v: formatCurrency(r.totalCommissionEarned) },
                  { l: 'Paid', v: formatCurrency(r.totalCommissionPaid) },
                  { l: 'Pending', v: formatCurrency(pending) },
                ].map((s) => (
                  <div key={s.l}>
                    <span style={labelStyle}>{s.l}</span>
                    <p style={{ ...valStyle, margin: '2px 0 0', fontSize: 15 }}>{s.v}</p>
                  </div>
                ))}
              </div>
              {analytics && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${ADMIN_COLORS.border}` }}>
                  <div><span style={labelStyle}>Click→Signup</span><p style={{ ...valStyle, margin: '2px 0 0', color: ADMIN_COLORS.purple400 }}>{analytics.clickToSignupRate}</p></div>
                  <div><span style={labelStyle}>Signup→Match</span><p style={{ ...valStyle, margin: '2px 0 0', color: ADMIN_COLORS.purple400 }}>{analytics.signupToFirstMatchRate}</p></div>
                  <div><span style={labelStyle}>Avg Rev/User</span><p style={{ ...valStyle, margin: '2px 0 0' }}>₹{analytics.avgRevenuePerUser}</p></div>
                  <div><span style={labelStyle}>Avg Comm/User</span><p style={{ ...valStyle, margin: '2px 0 0' }}>₹{analytics.avgCommissionPerUser}</p></div>
                </div>
              )}
            </div>

            {/* C — Click Trend Chart */}
            {trend.length > 0 && (
              <div style={sectionStyle}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>Click Trend (30 days)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trend}>
                    <XAxis dataKey="_id" tick={{ fontSize: 10, fill: ADMIN_COLORS.textMuted }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: ADMIN_COLORS.textMuted }} tickLine={false} axisLine={false} width={30} />
                    <Tooltip contentStyle={{ background: ADMIN_COLORS.bgCard, border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="clicks" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* D — Referred Users */}
            <div style={sectionStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>Referred Users ({users.length})</h3>
              {users.length === 0 ? (
                <p style={{ color: ADMIN_COLORS.textMuted, fontSize: 13 }}>No referred users yet.</p>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
                          {['Username', 'Email', 'Joined', 'Fraud'].map((h) => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: ADMIN_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageUsers.map((u) => {
                          const flags = u.fraudFlags?.length ?? 0;
                          return (
                            <tr key={u._id} style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}`, background: flags > 0 ? 'rgba(239,68,68,0.06)' : 'transparent' }}>
                              <td style={{ padding: '8px 10px', fontSize: 13, color: ADMIN_COLORS.textPrimary, fontWeight: 600 }}>{u.username}</td>
                              <td style={{ padding: '8px 10px', fontSize: 12, color: ADMIN_COLORS.textSecondary }}>{u.email}</td>
                              <td style={{ padding: '8px 10px', fontSize: 12, color: ADMIN_COLORS.textMuted }}>{formatDate(u.createdAt)}</td>
                              <td style={{ padding: '8px 10px' }}>
                                {flags > 0 ? (
                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', background: 'rgba(239,68,68,0.12)', padding: '2px 6px', borderRadius: 4 }}>{flags} flag{flags > 1 ? 's' : ''}</span>
                                ) : (
                                  <span style={{ fontSize: 11, color: ADMIN_COLORS.textMuted }}>Clean</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {userPages > 1 && (
                    <div className="flex" style={{ alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                      <button type="button" disabled={userPage <= 1} onClick={() => setUserPage(userPage - 1)} className="cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${ADMIN_COLORS.border}`, background: 'transparent', color: ADMIN_COLORS.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: userPage <= 1 ? 0.3 : 1 }}><ChevronLeft size={14} /></button>
                      <span style={{ fontSize: 12, color: ADMIN_COLORS.textMuted }}>{userPage}/{userPages}</span>
                      <button type="button" disabled={userPage >= userPages} onClick={() => setUserPage(userPage + 1)} className="cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${ADMIN_COLORS.border}`, background: 'transparent', color: ADMIN_COLORS.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: userPage >= userPages ? 0.3 : 1 }}><ChevronRight size={14} /></button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* E — Payout History */}
            <div style={sectionStyle}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>Payout History ({payouts.length})</h3>
              {payouts.length === 0 ? (
                <p style={{ color: ADMIN_COLORS.textMuted, fontSize: 13 }}>No payouts recorded.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
                        {['Date', 'Amount', 'Method', 'Txn Ref'].map((h) => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: ADMIN_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p._id} style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
                          <td style={{ padding: '8px 10px', fontSize: 12, color: ADMIN_COLORS.textSecondary }}>{formatDate(p.paidAt)}</td>
                          <td style={{ padding: '8px 10px', fontSize: 13, color: ADMIN_COLORS.success, fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                          <td style={{ padding: '8px 10px', fontSize: 12, color: ADMIN_COLORS.textSecondary }}>{p.method}</td>
                          <td style={{ padding: '8px 10px', fontSize: 12, color: ADMIN_COLORS.textMuted, fontFamily: 'monospace' }}>{p.transactionRef || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
