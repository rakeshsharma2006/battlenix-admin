'use client';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Copy, CheckCircle, Clock } from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import toast from 'react-hot-toast';

interface Payout {
  _id: string;
  matchId: string;
  winnerUsername: string;
  winnerUpiId: string;
  winnerGameUID: string | null;
  winnerGameName: string | null;
  amount: number;
  matchTitle: string;
  matchMap: string | null;
  matchMode: string | null;
  status: 'PENDING' | 'PAID';
  paidByUsername: string | null;
  paidAt: string | null;
  createdAt: string;
  notes: string | null;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filter !== 'ALL' ? `&status=${filter}` : '';
      const res = await fetch(
        `/api/proxy/admin/payouts?page=${page}&limit=20${statusParam}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      setPayouts(data.payouts ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { void loadPayouts(); }, [loadPayouts]);

  const copyUPI = (upi: string) => {
    void navigator.clipboard.writeText(upi);
    toast.success('UPI ID copied!');
  };

  const totalPending = payouts.filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payouts.filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminShell>
      <div className="p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Payout Management</h1>
            <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
              Manual prize payment tracking
            </p>
          </div>
          <button type="button" onClick={() => void loadPayouts()}
            className="p-2.5 rounded-xl transition cursor-pointer hover:bg-white/5"
            style={{ background: '#13131E', border: '1px solid #1E2035' }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: '#94A3B8' }} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-2xl"
            style={{ background: '#13131E', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" style={{ color: '#F59E0B' }} />
              <span className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: '#F59E0B' }}>Pending</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{totalPending.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-4 rounded-2xl"
            style={{ background: '#13131E', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#10B981' }} />
              <span className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: '#10B981' }}>Paid</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{totalPaid.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['ALL', 'PENDING', 'PAID'] as const).map(f => (
            <button key={f} type="button" onClick={() => { setFilter(f); setPage(1); }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer hover:bg-white/5"
              style={{
                background: filter === f ? '#7C3AED' : '#13131E',
                color: filter === f ? '#fff' : '#94A3B8',
                border: `1px solid ${filter === f ? '#7C3AED' : '#1E2035'}`,
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Payouts list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: '#94A3B8' }}>No payouts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map(payout => (
              <div key={payout._id} className="p-5 rounded-2xl"
                style={{
                  background: '#13131E',
                  border: `1px solid ${payout.status === 'PAID'
                    ? 'rgba(16,185,129,0.2)'
                    : 'rgba(245,158,11,0.2)'}`,
                }}>
                <div className="flex items-start justify-between gap-4">

                  {/* Left info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">
                        {payout.winnerUsername}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        payout.status === 'PAID'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {payout.status}
                      </span>
                    </div>
                    <p className="text-sm truncate" style={{ color: '#94A3B8' }}>
                      {payout.matchTitle}
                      {payout.matchMap && ` · ${payout.matchMap}`}
                      {payout.matchMode && ` · ${payout.matchMode}`}
                    </p>
                    {payout.winnerGameUID && (
                      <p className="text-xs mt-1" style={{ color: '#475569' }}>
                        UID: {payout.winnerGameUID}
                        {payout.winnerGameName && ` · ${payout.winnerGameName}`}
                      </p>
                    )}
                  </div>

                  {/* Right — amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold" style={{ color: '#F59E0B' }}>
                      ₹{payout.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#475569' }}>
                      {new Date(payout.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* UPI row */}
                <div className="mt-3 pt-3 flex items-center justify-between"
                  style={{ borderTop: '1px solid #1E2035' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#475569' }}>UPI:</span>
                    <span className="font-mono text-sm text-white">
                      {payout.winnerUpiId}
                    </span>
                    <button type="button" onClick={() => copyUPI(payout.winnerUpiId)}
                      className="p-1 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                      style={{ background: 'rgba(124,58,237,0.1)' }}>
                      <Copy className="w-3 h-3" style={{ color: '#A78BFA' }} />
                    </button>
                  </div>

                  {payout.status === 'PAID' && payout.paidByUsername && (
                    <p className="text-xs" style={{ color: '#475569' }}>
                      Paid by {payout.paidByUsername}
                      {payout.paidAt && ` · ${new Date(payout.paidAt).toLocaleString('en-IN')}`}
                    </p>
                  )}
                </div>

                {payout.notes && (
                  <p className="text-xs mt-2 italic" style={{ color: '#475569' }}>
                    Note: {payout.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-3 mt-6">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white/5 transition-colors"
              style={{ background: '#13131E', color: '#94A3B8', border: '1px solid #1E2035' }}>
              Previous
            </button>
            <span className="px-4 py-2 text-sm" style={{ color: '#94A3B8' }}>
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button type="button" onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="px-4 py-2 rounded-lg text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white/5 transition-colors"
              style={{ background: '#13131E', color: '#94A3B8', border: '1px solid #1E2035' }}>
              Next
            </button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
