// components/referrals/MarkPaidModal.tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

import { ADMIN_COLORS, formatCurrency, getErrorMessage } from '@/lib/admin-utils';
import { markPaid } from '@/lib/referral-api';
import type { MarkPaidPayload, PayoutMethod, ReferralCode } from '@/types/referral';

type MarkPaidModalProps = {
  open: boolean;
  referral: ReferralCode | null;
  onClose: () => void;
  onPaid: () => void;
};

const iS: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px', borderRadius: 10,
  border: `1px solid ${ADMIN_COLORS.border}`, background: ADMIN_COLORS.bgElevated,
  color: ADMIN_COLORS.textPrimary, fontSize: 14, outline: 'none',
};

const lS: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.textSecondary, marginBottom: 4, display: 'block',
};

export default function MarkPaidModal({ open, referral, onClose, onPaid }: MarkPaidModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<MarkPaidPayload>({ amount: 0, method: 'UPI', transactionRef: '', notes: '' });

  const pending = referral ? (referral.totalCommissionEarned || 0) - (referral.totalCommissionPaid || 0) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referral) return;
    if (form.amount <= 0) { toast.error('Amount must be > 0'); return; }
    if (form.amount > pending) { toast.error(`Amount exceeds pending (${formatCurrency(pending)})`); return; }
    setSubmitting(true);
    try {
      await markPaid(referral._id, form);
      toast.success('Payout recorded!');
      onPaid();
      onClose();
      setForm({ amount: 0, method: 'UPI', transactionRef: '', notes: '' });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to record payout.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !referral) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: ADMIN_COLORS.bgSurface, border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 20 }}>
        <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>Mark Paid — {referral.code}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${ADMIN_COLORS.border}`, background: 'transparent', color: ADMIN_COLORS.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        <form onSubmit={(e) => void submit(e)} style={{ padding: 24 }}>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>Pending Commission: {formatCurrency(pending)}</span>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <div><label style={lS}>Amount to Pay (₹) *</label><input style={iS} type="number" min={0} max={pending} value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))} required /></div>
            <div><label style={lS}>Method</label><select style={iS} value={form.method} onChange={(e) => setForm((p) => ({ ...p, method: e.target.value as PayoutMethod }))}><option value="UPI">UPI</option><option value="BANK">Bank Transfer</option><option value="CASH">Cash</option></select></div>
            <div><label style={lS}>Transaction Ref</label><input style={iS} value={form.transactionRef ?? ''} onChange={(e) => setForm((p) => ({ ...p, transactionRef: e.target.value }))} placeholder="UPI ref / bank txn id" /></div>
            <div><label style={lS}>Notes</label><textarea style={{ ...iS, height: 70, padding: '10px 12px', resize: 'vertical' }} value={form.notes ?? ''} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <div className="flex" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} className="cursor-pointer" style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${ADMIN_COLORS.border}`, background: 'transparent', color: ADMIN_COLORS.textSecondary, fontSize: 14, fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={submitting} className="cursor-pointer" style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', fontSize: 14, fontWeight: 600, opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Processing...' : 'Confirm Payout'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
