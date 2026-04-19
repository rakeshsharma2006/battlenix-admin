// hooks/useMatches.ts
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/admin-utils';
import type { Match } from '@/types';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMatches = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<{ matches: Match[] }>('/proxy/matches');
      setMatches(response.data.matches ?? []);
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to load matches.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Match['status']) => {
    let previousMatches: Match[] = [];

    setMatches((currentMatches) => {
      previousMatches = currentMatches;

      return currentMatches.map((match) => (
        match._id === id ? { ...match, status } : match
      ));
    });

    try {
      const response = await api.patch<{ match: Match }>(`/proxy/matches/${id}/status`, {
        status: status.toUpperCase(),
      });
      const updatedMatch = response.data.match;

      if (updatedMatch) {
        setMatches((currentMatches) => currentMatches.map((match) => (
          match._id === id ? updatedMatch : match
        )));
      }

      return updatedMatch;
    } catch (err) {
      setMatches(previousMatches);
      const message = getErrorMessage(err, 'Unable to update match status.');
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    void fetchMatches();
  }, []);

  return {
    matches,
    loading,
    error,
    refetch: fetchMatches,
    updateStatus,
  };
}
