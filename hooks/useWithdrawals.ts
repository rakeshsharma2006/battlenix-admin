// hooks/useWithdrawals.ts
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/admin-utils';
import type { Withdrawal } from '@/types';

export function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<{ withdrawals: Withdrawal[] }>('/proxy/payouts');
      setWithdrawals(response.data.withdrawals ?? []);
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to load withdrawals.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const processWithdrawal = async (id: string, action: 'approved' | 'rejected') => {
    let previousWithdrawals: Withdrawal[] = [];
    const processedAt = new Date().toISOString();

    setWithdrawals((currentWithdrawals) => {
      previousWithdrawals = currentWithdrawals;

      return currentWithdrawals.map((withdrawal) => (
        withdrawal._id === id
          ? { ...withdrawal, status: action, processedAt }
          : withdrawal
      ));
    });

    try {
      const response = await api.patch<{ withdrawal: Withdrawal }>(`/proxy/payouts/${id}`, {
        status: action.toUpperCase(),
      });
      const updatedWithdrawal = response.data.withdrawal;

      if (updatedWithdrawal) {
        setWithdrawals((currentWithdrawals) => currentWithdrawals.map((withdrawal) => (
          withdrawal._id === id ? updatedWithdrawal : withdrawal
        )));
      }

      toast.success(
        action === 'approved' ? 'Withdrawal approved successfully.' : 'Withdrawal rejected successfully.'
      );

      return updatedWithdrawal;
    } catch (err) {
      setWithdrawals(previousWithdrawals);
      const message = getErrorMessage(err, 'Unable to process withdrawal.');
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    void fetchWithdrawals();
  }, []);

  return {
    withdrawals,
    loading,
    error,
    refetch: fetchWithdrawals,
    processWithdrawal,
  };
}
