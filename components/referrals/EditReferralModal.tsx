// components/referrals/EditReferralModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

import { ADMIN_COLORS, getErrorMessage } from '@/lib/admin-utils';
import { updateReferral } from '@/lib/referral-api';
import type { CommissionModel, Platform, ReferralCode, UpdateReferralPayload } from '@/types/referral';

type EditReferralModalProps = {
  open: boolean;
  referral: ReferralCode | null;
  onClose: () => void;
  onUpdated: () => void;
};

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'DISCORD', label: 'Discord' },
  { value: 'OTHER', label: 'Other' },
];

const COMMISSIONS: { value: CommissionModel; label: string }[] = [
  { value: 'PER_FIRST_MATCH', label: 'Per First Match' },
  { value: 'PERCENT_REVENUE', label: 'Percent Revenue' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const iS: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px', borderRadius: 10,
  border: `1px solid ${ADMIN_COLORS.border}`, background: ADMIN_COLORS.bgElevated,
  color: ADMIN_COLORS.textPrimary, fontSize: 14, outline: 'none',
};

const lS: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.textSecondary, marginBottom: 4, display: 'block',
};

export default function EditReferralModal({ open, referral, onClose, onUpdated }: EditReferralModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<UpdateReferralPayload>({});

  useEffect(() => {
    if (referral) {
      setForm({
        creatorName: referral.creatorName, channelName: referral.channelName ?? '',
        platform: referral.platform, channelUrl: referral.channelUrl ?? '',
        commissionModel: referral.commissionModel, commissionPerUser: referral.commissionPerUser,
        commissionPercent: referral.commissionPercent, rewardCoinsToUser: referral.rewardCoinsToUser,
        rewardCashToUser: referral.rewardCashToUser,
        expiresAt: referral.expiresAt ? referral.expiresAt.slice(0, 10) : null,
        notes: referral.notes ?? '',
      });
    }
  }, [referral]);

  const set = <K extends keyof UpdateReferralPayload>(k: K, v: UpdateReferralPayload[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referral) return;
    setSubmitting(true);
    try {
      const payload: any = {
        ...form,
        commissionPerUser: form.commissionPerUser !== undefined ? Number(form.commissionPerUser) : undefined,
        commissionPercent: form.commissionPercent !== undefined ? Number(form.commissionPercent) : undefined,
        rewardCoinsToUser: form.rewardCoinsToUser !== undefined ? Number(form.rewardCoinsToUser) : undefined,
        rewardCashToUser: form.rewardCashToUser !== undefined ? Number(form.rewardCashToUser) : undefined,
      };

      if (!payload.expiresAt) {
        payload.expiresAt = null;
      } else {
        payload.expiresAt = new Date(payload.expiresAt).toISOString();
      }

      if (!payload.channelUrl) {
        payload.channelUrl = '';
      }
      if (!payload.channelName) {
        delete payload.channelName;
      }
      if (!payload.notes) {
        delete payload.notes;
      }

      console.log('Submitting edit payload:', payload);

      await updateReferral(referral._id, payload);
      toast.success('Referral updated!');
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error('API error:', err.response?.data || err);
      let msg = getErrorMessage(err, 'Failed to update.');
      if (err.response?.data?.errors?.length) {
        msg = err.response.data.errors.map((e: any) => `${e.path}: ${e.message}`).join(', ');
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !referral) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: ADMIN_COLORS.bgSurface, border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 20 }}>
        <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>Edit — {referral.code}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${ADMIN_COLORS.border}`, background: 'transparent', color: ADMIN_COLORS.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        <form onSubmit={(e) => void submit(e)} style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={lS}>Code (read-only)</label><input style={{ ...iS, opacity: 0.5, cursor: 'not-allowed', fontFamily: 'monospace' }} value={referral.code} readOnly /></div>
            <div><label style={lS}>Creator Name *</label><input style={iS} value={form.creatorName ?? ''} onChange={(e) => set('creatorName', e.target.value)} required /></div>
            <div><label style={lS}>Channel Name</label><input style={iS} value={form.channelName ?? ''} onChange={(e) => set('channelName', e.target.value)} /></div>
            <div><label style={lS}>Platform</label><select style={iS} value={form.platform} onChange={(e) => set('platform', e.target.value as Platform)}>{PLATFORMS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div style={{ gridColumn: '1/-1' }}><label style={lS}>Channel URL</label><input style={iS} value={form.channelUrl ?? ''} onChange={(e) => set('channelUrl', e.target.value)} /></div>
            <div><label style={lS}>Commission Model</label><select style={iS} value={form.commissionModel} onChange={(e) => set('commissionModel', e.target.value as CommissionModel)}>{COMMISSIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div><label style={lS}>Per User (₹)</label><input style={iS} type="number" min={0} value={form.commissionPerUser ?? 0} onChange={(e) => set('commissionPerUser', Number(e.target.value))} /></div>
            <div><label style={lS}>Percent (%)</label><input style={iS} type="number" min={0} max={50} value={form.commissionPercent ?? 0} onChange={(e) => set('commissionPercent', Number(e.target.value))} /></div>
            <div><label style={lS}>Reward Coins</label><input style={iS} type="number" min={0} value={form.rewardCoinsToUser ?? 0} onChange={(e) => set('rewardCoinsToUser', Number(e.target.value))} /></div>
            <div><label style={lS}>Reward Cash (₹)</label><input style={iS} type="number" min={0} value={form.rewardCashToUser ?? 0} onChange={(e) => set('rewardCashToUser', Number(e.target.value))} /></div>
            <div><label style={lS}>Expiry</label><input style={iS} type="date" value={form.expiresAt ?? ''} onChange={(e) => set('expiresAt', e.target.value || null)} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={lS}>Notes</label><textarea style={{ ...iS, height: 70, padding: '10px 12px', resize: 'vertical' }} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></div>
          </div>
          <div className="flex" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} className="cursor-pointer" style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${ADMIN_COLORS.border}`, background: 'transparent', color: ADMIN_COLORS.textSecondary, fontSize: 14, fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={submitting} className="cursor-pointer" style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', color: '#fff', fontSize: 14, fontWeight: 600, opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
