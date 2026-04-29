// components/referrals/FraudWidget.tsx
'use client';

import { ADMIN_COLORS, formatDate } from '@/lib/admin-utils';
import type { ReferralCode } from '@/types/referral';

type FraudUser = {
  username: string;
  code: string;
  fraudFlags: string[];
  createdAt: string;
};

type FraudWidgetProps = {
  codes: ReferralCode[];
  loading: boolean;
};

/**
 * Fraud widget is a placeholder that shows codes with suspicious patterns.
 * Since the list API doesn't return per-user fraud flags, we surface
 * codes that have suspiciously high click-to-signup ratios or zero revenue
 * despite many signups, as a heuristic until the detail API is called.
 *
 * When a detail drawer has been opened, the full referred-user fraud data
 * is visible there. This widget serves as a quick glance.
 */
export default function FraudWidget({ codes, loading }: FraudWidgetProps) {
  // Heuristic: flag codes with signups but 0 revenue and 0 first matches
  const suspicious = codes.filter(
    (c) => c.totalSignups > 0 && c.totalFirstMatches === 0 && c.totalRevenue === 0
  );

  if (loading) {
    return (
      <div style={{
        background: ADMIN_COLORS.bgCard,
        border: `1px solid ${ADMIN_COLORS.border}`,
        borderRadius: 16,
        padding: 20,
      }}>
        <div className="animate-pulse" style={{ height: 16, width: '60%', borderRadius: 6, background: ADMIN_COLORS.bgElevated, marginBottom: 12 }} />
        <div className="animate-pulse" style={{ height: 40, borderRadius: 8, background: ADMIN_COLORS.bgElevated }} />
      </div>
    );
  }

  return (
    <div style={{
      background: ADMIN_COLORS.bgCard,
      border: `1px solid ${suspicious.length > 0 ? 'rgba(239,68,68,0.25)' : ADMIN_COLORS.border}`,
      borderRadius: 16,
      padding: 20,
    }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>
        🚨 Fraud Watch
      </h3>

      {suspicious.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: ADMIN_COLORS.textMuted }}>
          No suspicious codes detected.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
                {['Creator', 'Code', 'Signups', 'Revenue', 'Created'].map((h) => (
                  <th key={h} style={{
                    padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                    color: ADMIN_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suspicious.slice(0, 5).map((c) => (
                <tr key={c._id} style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}`, background: 'rgba(239,68,68,0.04)' }}>
                  <td style={{ padding: '8px', fontSize: 13, color: ADMIN_COLORS.textPrimary, fontWeight: 600 }}>{c.creatorName}</td>
                  <td style={{ padding: '8px', fontSize: 12, fontFamily: 'monospace', color: '#EF4444' }}>{c.code}</td>
                  <td style={{ padding: '8px', fontSize: 12, color: ADMIN_COLORS.textSecondary }}>{c.totalSignups}</td>
                  <td style={{ padding: '8px', fontSize: 12, color: ADMIN_COLORS.textSecondary }}>₹0</td>
                  <td style={{ padding: '8px', fontSize: 11, color: ADMIN_COLORS.textMuted }}>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {suspicious.length > 5 && (
            <p style={{ margin: '8px 0 0', fontSize: 11, color: ADMIN_COLORS.textMuted }}>
              +{suspicious.length - 5} more suspicious codes
            </p>
          )}
        </div>
      )}
    </div>
  );
}
