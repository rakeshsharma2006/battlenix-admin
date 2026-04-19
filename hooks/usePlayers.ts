// hooks/usePlayers.ts
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/admin-utils';
import type { Player } from '@/types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPlayers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<{ users: Player[] }>('/proxy/users');
      setPlayers(response.data.users ?? []);
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to load players.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (id: string, banned: boolean) => {
    let previousPlayers: Player[] = [];

    setPlayers((currentPlayers) => {
      previousPlayers = currentPlayers;

      return currentPlayers.map((player) => (
        player._id === id ? { ...player, banned } : player
      ));
    });

    try {
      const response = await api.patch<{ user: Player }>(`/proxy/users/${id}/ban`, { banned });
      const updatedPlayer = response.data.user;

      if (updatedPlayer) {
        setPlayers((currentPlayers) => currentPlayers.map((player) => (
          player._id === id ? updatedPlayer : player
        )));
      }

      return updatedPlayer;
    } catch (err) {
      setPlayers(previousPlayers);
      const message = getErrorMessage(err, 'Unable to update player access.');
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    void fetchPlayers();
  }, []);

  return {
    players,
    loading,
    error,
    refetch: fetchPlayers,
    toggleBan,
  };
}
