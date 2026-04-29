// components/referrals/CreateReferralModal.tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

import { ADMIN_COLORS, getErrorMessage } from '@/lib/admin-utils';
import { createReferral } from '@/lib/referral-api';
import type { CommissionModel, CreateReferralPayload, Platform } from '@/types/referral';

type CreateReferralModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'DISCORD', label: 'Discord' },
  { value: 'OTHER', label: 'Other' },
];

const COMMISSION_OPTIONS: { value: CommissionModel; label: string }[] = [
  { value: 'PER_FIRST_MATCH', label: 'Per First Match' },
  { value: 'PERCENT_REVENUE', label: 'Percent Revenue' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  borderRadius: 10,
  border: `1px solid ${ADMIN_COLORS.border}`,
  background: ADMIN_COLORS.bgElevated,
  color: ADMIN_COLORS.textPrimary,
  fontSize: 14,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: ADMIN_COLORS.textSecondary,
  marginBottom: 4,
  display: 'block',
};

export default function CreateReferralModal({ open, onClose, onCreated }: CreateReferralModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateReferralPayload>({
    code: '',
    creatorName: '',
    channelName: '',
    platform: 'YOUTUBE',
    channelUrl: '',
    commissionModel: 'PER_FIRST_MATCH',
    commissionPerUser: 0,
    commissionPercent: 0,
    rewardCoinsToUser: 0,
    rewardCashToUser: 0,
    expiresAt: null,
    notes: '',
  });

  const setField = <K extends keyof CreateReferralPayload>(key: K, value: CreateReferralPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.creatorName.trim()) {
      toast.error('Creator name is required.');
      return;
    }
    if (!form.code.trim()) {
      toast.error('Code is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        ...form,
        code: form.code.toUpperCase().trim(),
        commissionPerUser: Number(form.commissionPerUser),
        commissionPercent: Number(form.commissionPercent),
        rewardCoinsToUser: Number(form.rewardCoinsToUser),
        rewardCashToUser: Number(form.rewardCashToUser),
      };

      if (!payload.expiresAt) {
        delete payload.expiresAt;
      } else {
        payload.expiresAt = new Date(payload.expiresAt).toISOString();
      }

      if (!payload.channelUrl) {
        delete payload.channelUrl;
      }
      if (!payload.channelName) {
        delete payload.channelName;
      }
      if (!payload.notes) {
        delete payload.notes;
      }

      console.log('Submitting payload:', payload);

      const res = await createReferral(payload);
      console.log('API response:', res);
      
      toast.success('Referral code created!');
      onCreated();
      onClose();
      setForm({
        code: '',
        creatorName: '',
        channelName: '',
        platform: 'YOUTUBE',
        channelUrl: '',
        commissionModel: 'PER_FIRST_MATCH',
        commissionPerUser: 0,
        commissionPercent: 0,
        rewardCoinsToUser: 0,
        rewardCashToUser: 0,
        expiresAt: null,
        notes: '',
      });
    } catch (err: any) {
      console.error('API error:', err.response?.data || err);
      let msg = getErrorMessage(err, 'Failed to create referral code.');
      if (err.response?.data?.errors?.length) {
        msg = err.response.data.errors.map((e: any) => `${e.path}: ${e.message}`).join(', ');
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: ADMIN_COLORS.bgSurface,
          border: `1px solid ${ADMIN_COLORS.border}`,
          borderRadius: 20,
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          className="flex"
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${ADMIN_COLORS.border}`,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>
            + New Creator Code
          </h2>
          <button
            type="button"
            onClick={onClose}
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
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Creator Name */}
            <div>
              <label style={labelStyle}>Creator Name *</label>
              <input
                style={inputStyle}
                value={form.creatorName}
                onChange={(e) => setField('creatorName', e.target.value)}
                placeholder="Creator name"
                required
              />
            </div>

            {/* Channel Name */}
            <div>
              <label style={labelStyle}>Channel Name</label>
              <input
                style={inputStyle}
                value={form.channelName ?? ''}
                onChange={(e) => setField('channelName', e.target.value)}
                placeholder="Channel name"
              />
            </div>

            {/* Platform */}
            <div>
              <label style={labelStyle}>Platform *</label>
              <select
                style={inputStyle}
                value={form.platform}
                onChange={(e) => setField('platform', e.target.value as Platform)}
              >
                {PLATFORM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Code */}
            <div>
              <label style={labelStyle}>Code *</label>
              <input
                style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase' }}
                value={form.code}
                onChange={(e) => setField('code', e.target.value.toUpperCase())}
                placeholder="CREATORCODE"
                required
              />
            </div>

            {/* Channel URL */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Channel URL</label>
              <input
                style={inputStyle}
                value={form.channelUrl ?? ''}
                onChange={(e) => setField('channelUrl', e.target.value)}
                placeholder="https://youtube.com/@channel"
              />
            </div>

            {/* Commission Model */}
            <div>
              <label style={labelStyle}>Commission Model</label>
              <select
                style={inputStyle}
                value={form.commissionModel}
                onChange={(e) => setField('commissionModel', e.target.value as CommissionModel)}
              >
                {COMMISSION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Commission Per User */}
            <div>
              <label style={labelStyle}>Commission Per User (₹)</label>
              <input
                style={inputStyle}
                type="number"
                min={0}
                value={form.commissionPerUser ?? 0}
                onChange={(e) => setField('commissionPerUser', Number(e.target.value))}
              />
            </div>

            {/* Commission Percent */}
            <div>
              <label style={labelStyle}>Commission Percent (%)</label>
              <input
                style={inputStyle}
                type="number"
                min={0}
                max={50}
                value={form.commissionPercent ?? 0}
                onChange={(e) => setField('commissionPercent', Number(e.target.value))}
              />
            </div>

            {/* Reward Coins */}
            <div>
              <label style={labelStyle}>Reward Coins to User</label>
              <input
                style={inputStyle}
                type="number"
                min={0}
                value={form.rewardCoinsToUser ?? 0}
                onChange={(e) => setField('rewardCoinsToUser', Number(e.target.value))}
              />
            </div>

            {/* Reward Cash */}
            <div>
              <label style={labelStyle}>Reward Cash to User (₹)</label>
              <input
                style={inputStyle}
                type="number"
                min={0}
                value={form.rewardCashToUser ?? 0}
                onChange={(e) => setField('rewardCashToUser', Number(e.target.value))}
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label style={labelStyle}>Expiry Date (optional)</label>
              <input
                style={inputStyle}
                type="date"
                value={form.expiresAt ?? ''}
                onChange={(e) => setField('expiresAt', e.target.value || null)}
              />
            </div>

            {/* Notes */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                style={{
                  ...inputStyle,
                  height: 80,
                  padding: '10px 12px',
                  resize: 'vertical',
                }}
                value={form.notes ?? ''}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Internal notes..."
              />
            </div>
          </div>

          <div className="flex" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer"
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: `1px solid ${ADMIN_COLORS.border}`,
                background: 'transparent',
                color: ADMIN_COLORS.textSecondary,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer"
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Creating...' : 'Create Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
