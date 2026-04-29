// components/referrals/QrModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';

import { ADMIN_COLORS, getErrorMessage } from '@/lib/admin-utils';
import { fetchQrCode } from '@/lib/referral-api';
import type { ReferralCode, QrResponse } from '@/types/referral';

type QrModalProps = {
  open: boolean;
  referral: ReferralCode | null;
  onClose: () => void;
};

export default function QrModal({ open, referral, onClose }: QrModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QrResponse | null>(null);

  useEffect(() => {
    if (!open || !referral) { setData(null); return; }
    setLoading(true);
    fetchQrCode(referral._id)
      .then(setData)
      .catch((e) => toast.error(getErrorMessage(e, 'Failed to load QR.')))
      .finally(() => setLoading(false));
  }, [open, referral]);

  if (!open || !referral) return null;

  const shareText = `Join BattleNix using my code ${referral.code}`;

  const copyLink = () => {
    if (data?.link) navigator.clipboard.writeText(data.link).then(() => toast.success('Link copied!'));
  };
  const copyCode = () => {
    navigator.clipboard.writeText(referral.code).then(() => toast.success('Code copied!'));
  };
  const downloadQr = () => {
    if (!data?.qrCode) return;
    const a = document.createElement('a');
    a.href = data.qrCode;
    a.download = `qr_${referral.code}.png`;
    a.click();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: ADMIN_COLORS.bgSurface, border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 20 }}>
        <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>QR Code — {referral.code}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${ADMIN_COLORS.border}`, background: 'transparent', color: ADMIN_COLORS.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ padding: 24, textAlign: 'center' }}>
          {loading ? (
            <div className="animate-pulse" style={{ width: 200, height: 200, margin: '0 auto', borderRadius: 16, background: ADMIN_COLORS.bgElevated }} />
          ) : data?.qrCode ? (
            <img src={data.qrCode} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 12, margin: '0 auto' }} />
          ) : (
            <p style={{ color: ADMIN_COLORS.textMuted }}>No QR available.</p>
          )}

          {data?.link && (
            <p style={{ marginTop: 16, fontSize: 13, color: ADMIN_COLORS.textSecondary, wordBreak: 'break-all', fontFamily: 'monospace' }}>{data.link}</p>
          )}

          <div className="flex" style={{ justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={copyLink} className="cursor-pointer" style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${ADMIN_COLORS.border}`, background: 'transparent', color: ADMIN_COLORS.textPrimary, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Copy size={14} /> Copy Link</button>
            <button type="button" onClick={copyCode} className="cursor-pointer" style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${ADMIN_COLORS.border}`, background: 'transparent', color: ADMIN_COLORS.textPrimary, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Copy size={14} /> Copy Code</button>
            <button type="button" onClick={downloadQr} className="cursor-pointer" style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Download size={14} /> Download</button>
          </div>

          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: ADMIN_COLORS.bgElevated, border: `1px solid ${ADMIN_COLORS.border}` }}>
            <p style={{ margin: 0, fontSize: 12, color: ADMIN_COLORS.textMuted, marginBottom: 4 }}>Share Text Preview</p>
            <p style={{ margin: 0, fontSize: 14, color: ADMIN_COLORS.textPrimary }}>{shareText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
