// app/payments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

import AdminShell from '@/components/AdminShell';
import DataTable, { type DataTableColumn } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import {
  ADMIN_COLORS,
  formatCurrency,
  formatDateTime,
  formatPaymentType,
  getErrorMessage,
  getPaymentTypeBadgeStyle,
  truncateText,
} from '@/lib/admin-utils';
import type { Payment } from '@/types';

const TYPE_OPTIONS: Array<{ value: 'all' | Payment['type']; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'prize', label: 'Prize' },
  { value: 'entry_fee', label: 'Entry Fee' },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Payment['type']>('all');

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get<{ payments: Payment[] }>('/proxy/payments');
        setPayments(response.data.payments ?? []);
      } catch (err) {
        const message = getErrorMessage(err, 'Unable to load payments.');
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || payment.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const successfulPayments = payments.filter((payment) => payment.status === 'success');
  const totalDeposits = successfulPayments
    .filter((payment) => payment.type === 'deposit')
    .reduce((total, payment) => total + payment.amount, 0);
  const totalWithdrawals = successfulPayments
    .filter((payment) => payment.type === 'withdrawal')
    .reduce((total, payment) => total + payment.amount, 0);
  const totalPrizes = successfulPayments
    .filter((payment) => payment.type === 'prize')
    .reduce((total, payment) => total + payment.amount, 0);
  const totalEntryFees = successfulPayments
    .filter((payment) => payment.type === 'entry_fee')
    .reduce((total, payment) => total + payment.amount, 0);

  const tableColumns: DataTableColumn<Payment>[] = [
    {
      key: 'transactionId',
      label: 'Transaction ID',
      render: (payment) => (
        <span style={{ color: ADMIN_COLORS.textSecondary, fontFamily: 'monospace' }}>
          {truncateText(payment.transactionId, 12)}
        </span>
      ),
    },
    {
      key: 'player',
      label: 'Player',
      render: (payment) => <span style={{ color: ADMIN_COLORS.textPrimary }}>{payment.userId.username}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (payment) => {
        const badgeStyle = getPaymentTypeBadgeStyle(payment.type);

        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 10px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              ...badgeStyle,
            }}
          >
            {formatPaymentType(payment.type)}
          </span>
        );
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (payment) => (
        <span
          style={{
            color:
              payment.type === 'deposit' || payment.type === 'prize'
                ? ADMIN_COLORS.success
                : ADMIN_COLORS.error,
            fontWeight: 700,
          }}
        >
          {formatCurrency(payment.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (payment) => <StatusBadge status={payment.status} variant="payment" />,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (payment) => (
        <span style={{ color: ADMIN_COLORS.textSecondary }}>{formatDateTime(payment.createdAt)}</span>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="flex" style={{ flexDirection: 'column', gap: 20 }}>
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

        <section className="payments-summary-grid">
          <div
            style={{
              background: ADMIN_COLORS.bgCard,
              border: `1px solid ${ADMIN_COLORS.border}`,
              borderRadius: 8,
              padding: '12px 16px',
            }}
          >
            <p style={{ margin: 0, color: ADMIN_COLORS.success, fontSize: 12, textTransform: 'uppercase' }}>
              Total Deposits
            </p>
            <strong style={{ display: 'block', marginTop: 6, color: ADMIN_COLORS.textPrimary, fontSize: 20 }}>
              {formatCurrency(totalDeposits)}
            </strong>
          </div>

          <div
            style={{
              background: ADMIN_COLORS.bgCard,
              border: `1px solid ${ADMIN_COLORS.border}`,
              borderRadius: 8,
              padding: '12px 16px',
            }}
          >
            <p style={{ margin: 0, color: ADMIN_COLORS.error, fontSize: 12, textTransform: 'uppercase' }}>
              Total Withdrawals
            </p>
            <strong style={{ display: 'block', marginTop: 6, color: ADMIN_COLORS.textPrimary, fontSize: 20 }}>
              {formatCurrency(totalWithdrawals)}
            </strong>
          </div>

          <div
            style={{
              background: ADMIN_COLORS.bgCard,
              border: `1px solid ${ADMIN_COLORS.border}`,
              borderRadius: 8,
              padding: '12px 16px',
            }}
          >
            <p style={{ margin: 0, color: ADMIN_COLORS.gold, fontSize: 12, textTransform: 'uppercase' }}>
              Prize Distributed
            </p>
            <strong style={{ display: 'block', marginTop: 6, color: ADMIN_COLORS.textPrimary, fontSize: 20 }}>
              {formatCurrency(totalPrizes)}
            </strong>
          </div>

          <div
            style={{
              background: ADMIN_COLORS.bgCard,
              border: `1px solid ${ADMIN_COLORS.border}`,
              borderRadius: 8,
              padding: '12px 16px',
            }}
          >
            <p style={{ margin: 0, color: ADMIN_COLORS.purple400, fontSize: 12, textTransform: 'uppercase' }}>
              Entry Fees Collected
            </p>
            <strong style={{ display: 'block', marginTop: 6, color: ADMIN_COLORS.textPrimary, fontSize: 20 }}>
              {formatCurrency(totalEntryFees)}
            </strong>
          </div>
        </section>

        <div className="payments-filter-bar flex">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              color={ADMIN_COLORS.textMuted}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by transaction ID"
              style={{
                width: '100%',
                height: 42,
                borderRadius: 10,
                border: `1px solid ${ADMIN_COLORS.border}`,
                background: ADMIN_COLORS.bgCard,
                color: ADMIN_COLORS.textPrimary,
                padding: '0 14px 0 40px',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'all' | Payment['type'])}
            style={{
              height: 42,
              minWidth: 170,
              borderRadius: 10,
              border: `1px solid ${ADMIN_COLORS.border}`,
              background: ADMIN_COLORS.bgCard,
              color: ADMIN_COLORS.textPrimary,
              padding: '0 14px',
              fontSize: 14,
              outline: 'none',
            }}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={tableColumns}
          data={filteredPayments}
          loading={loading}
          emptyMessage="No payments match the selected filters."
        />
      </div>

      <style jsx>{`
        .payments-summary-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .payments-filter-bar {
          gap: 12px;
          align-items: center;
        }

        @media (max-width: 1024px) {
          .payments-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .payments-summary-grid {
            grid-template-columns: 1fr;
          }

          .payments-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </AdminShell>
  );
}
