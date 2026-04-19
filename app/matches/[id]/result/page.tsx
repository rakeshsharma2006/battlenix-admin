// app/matches/[id]/result/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Trophy, Users } from 'lucide-react';

import AdminShell from '@/components/AdminShell';
import { ADMIN_COLORS } from '@/lib/admin-utils';

interface Player {
  _id: string;
  username: string;
}

interface MatchDetail {
  _id: string;
  title: string;
  map: string;
  mode: string;
  entryFee: number;
  status: string;
  players: Player[];
  maxPlayers: number;
  prizeBreakdown: {
    playerPrize: number;
    teamSize: number;
    prizePerMember: number;
  };
}

interface ResultEntry {
  userId: string;
  position: number;
  kills: number;
}

export default function SubmitResultPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [winner, setWinner] = useState('');
  const [winnerTeam, setWinnerTeam] = useState<string[]>([]);
  const [results, setResults] = useState<ResultEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`/api/proxy/matches/${matchId}`, {
          credentials: 'include',
        });
        const data = await response.json();
        const currentMatch = data.match as MatchDetail | undefined;

        if (!response.ok || !currentMatch) {
          setError(data.message || 'Failed to load match');
          return;
        }

        setMatch(currentMatch);

        if (currentMatch.players) {
          setResults(currentMatch.players.map((player, index) => ({
            userId: player._id,
            position: index + 1,
            kills: 0,
          })));
        }
      } catch {
        setError('Failed to load match');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [matchId]);

  const updateResult = (userId: string, field: 'position' | 'kills', value: number) => {
    setResults((currentResults) => currentResults.map((result) => (
      result.userId === userId ? { ...result, [field]: value } : result
    )));
  };

  const toggleWinnerTeam = (userId: string) => {
    setWinnerTeam((currentWinnerTeam) => (
      currentWinnerTeam.includes(userId)
        ? currentWinnerTeam.filter((id) => id !== userId)
        : [...currentWinnerTeam, userId]
    ));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!winner) {
      setError('Please select a winner');
      return;
    }

    if (results.length === 0) {
      setError('No players found');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const body: {
        winner: string;
        results: ResultEntry[];
        winnerTeam?: string[];
      } = { winner, results };

      if (winnerTeam.length > 0) {
        body.winnerTeam = winnerTeam;
      }

      const response = await fetch(`/api/proxy/matches/${matchId}/result`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to submit result');
        return;
      }

      setSuccess('Match result submitted! Prize credited to winner.');
      window.setTimeout(() => router.push('/matches'), 2000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cardStyle = {
    background: ADMIN_COLORS.bgCard,
    border: `1px solid ${ADMIN_COLORS.border}`,
    borderRadius: 16,
    padding: 20,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ADMIN_COLORS.bgPrimary }}>
        <div
          className="animate-spin"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `2px solid ${ADMIN_COLORS.purple500}`,
            borderTopColor: 'transparent',
          }}
        />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ADMIN_COLORS.bgPrimary }}>
        <p style={{ color: ADMIN_COLORS.error }}>Match not found</p>
      </div>
    );
  }

  const isTeamMode = match.mode !== 'Solo';
  const teamSize = match.prizeBreakdown?.teamSize ?? 1;

  return (
    <AdminShell>
      <div style={{ maxWidth: 1024, margin: '0 auto' }}>
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: 8,
              borderRadius: 12,
              background: ADMIN_COLORS.bgCard,
              border: `1px solid ${ADMIN_COLORS.border}`,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={20} color={ADMIN_COLORS.textPrimary} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>
              Submit Match Result
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: ADMIN_COLORS.textSecondary }}>
              {match.title} · {match.map} · {match.mode}
            </p>
          </div>
        </div>

        {match.status !== 'LIVE' ? (
          <div
            className="mb-6 p-4 rounded-xl"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <p style={{ margin: 0, color: ADMIN_COLORS.warning }}>
              Match status is {match.status}. Results can only be submitted for LIVE matches.
            </p>
          </div>
        ) : null}

        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-4"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <Trophy size={24} color={ADMIN_COLORS.gold} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, color: ADMIN_COLORS.textPrimary, fontWeight: 600 }}>
              Winner Prize: ₹{match.prizeBreakdown?.playerPrize ?? 0}
            </p>
            {isTeamMode ? (
              <p style={{ margin: '2px 0 0', fontSize: 14, color: ADMIN_COLORS.textSecondary }}>
                {teamSize} players · ₹{match.prizeBreakdown?.prizePerMember ?? 0} each
              </p>
            ) : null}
          </div>
        </div>

        {error ? (
          <div
            className="mb-4 p-4 rounded-xl"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <p style={{ margin: 0, color: ADMIN_COLORS.error }}>{error}</p>
          </div>
        ) : null}

        {success ? (
          <div
            className="mb-4 p-4 rounded-xl flex items-center gap-3"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <Check size={20} color={ADMIN_COLORS.success} />
            <p style={{ margin: 0, color: ADMIN_COLORS.success }}>{success}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div style={cardStyle} className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} color={ADMIN_COLORS.purple600} />
              <h2 style={{ margin: 0, color: ADMIN_COLORS.textPrimary, fontWeight: 600 }}>
                Player Results ({match.players?.length ?? 0} players)
              </h2>
            </div>

            <div
              className="grid gap-3 mb-3 px-3"
              style={{
                gridTemplateColumns: isTeamMode ? '2fr 1fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr',
              }}
            >
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: ADMIN_COLORS.textMuted }}>Player</span>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: ADMIN_COLORS.textMuted }}>Position</span>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: ADMIN_COLORS.textMuted }}>Kills</span>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: ADMIN_COLORS.textMuted }}>Winner</span>
              {isTeamMode ? (
                <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: ADMIN_COLORS.textMuted }}>Team</span>
              ) : null}
            </div>

            <div className="space-y-2">
              {match.players?.map((player) => {
                const result = results.find((entry) => entry.userId === player._id);
                const isWinner = winner === player._id;
                const isInTeam = winnerTeam.includes(player._id);

                return (
                  <div
                    key={player._id}
                    className="grid gap-3 items-center p-3 rounded-xl transition-all"
                    style={{
                      gridTemplateColumns: isTeamMode ? '2fr 1fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr',
                      background: isWinner ? 'rgba(245,158,11,0.08)' : ADMIN_COLORS.bgElevated,
                      border: `1px solid ${isWinner ? 'rgba(245,158,11,0.3)' : ADMIN_COLORS.border}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="flex"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#FFFFFF',
                          background: ADMIN_COLORS.purple600,
                        }}
                      >
                        {player.username[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: ADMIN_COLORS.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {player.username}
                      </span>
                      {isWinner ? (
                        <span
                          style={{
                            fontSize: 12,
                            padding: '2px 8px',
                            borderRadius: 9999,
                            fontWeight: 700,
                            background: 'rgba(245,158,11,0.2)',
                            color: ADMIN_COLORS.gold,
                          }}
                        >
                          Winner
                        </span>
                      ) : null}
                    </div>

                    <input
                      type="number"
                      min={1}
                      max={match.maxPlayers}
                      value={result?.position ?? 1}
                      onChange={(event) => updateResult(player._id, 'position', Number(event.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 14,
                        textAlign: 'center',
                        background: ADMIN_COLORS.bgCard,
                        border: `1px solid ${ADMIN_COLORS.border}`,
                        color: ADMIN_COLORS.textPrimary,
                        outline: 'none',
                      }}
                    />

                    <input
                      type="number"
                      min={0}
                      max={match.maxPlayers - 1}
                      value={result?.kills ?? 0}
                      onChange={(event) => updateResult(player._id, 'kills', Number(event.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 14,
                        textAlign: 'center',
                        background: ADMIN_COLORS.bgCard,
                        border: `1px solid ${ADMIN_COLORS.border}`,
                        color: ADMIN_COLORS.textPrimary,
                        outline: 'none',
                      }}
                    />

                    <div className="flex justify-center">
                      <input
                        type="radio"
                        name="winner"
                        value={player._id}
                        checked={isWinner}
                        onChange={() => {
                          setWinner(player._id);
                          if (isTeamMode) {
                            setWinnerTeam([player._id]);
                          }
                        }}
                        className="w-4 h-4 accent-purple-600"
                      />
                    </div>

                    {isTeamMode ? (
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={isInTeam}
                          onChange={() => toggleWinnerTeam(player._id)}
                          className="w-4 h-4 accent-purple-600"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {isTeamMode ? (
              <p style={{ fontSize: 12, margin: '16px 0 0', padding: '0 12px', color: ADMIN_COLORS.textMuted }}>
                Select winner radio and check team members who share the prize (max {teamSize} for {match.mode}).
              </p>
            ) : null}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || match.status !== 'LIVE'}
              style={{
                flex: 1,
                padding: '16px 20px',
                borderRadius: 12,
                fontWeight: 600,
                color: '#FFFFFF',
                border: 'none',
                cursor: submitting || match.status !== 'LIVE' ? 'not-allowed' : 'pointer',
                background: match.status !== 'LIVE' || submitting
                  ? '#4B5563'
                  : 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
                boxShadow: match.status === 'LIVE' && !submitting ? '0 4px 20px rgba(124,58,237,0.35)' : 'none',
              }}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="animate-spin"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: '2px solid #FFFFFF',
                      borderTopColor: 'transparent',
                    }}
                  />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Trophy size={16} />
                  Submit Result & Credit Prize
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '16px 32px',
                borderRadius: 12,
                fontWeight: 500,
                background: ADMIN_COLORS.bgCard,
                color: ADMIN_COLORS.textSecondary,
                border: `1px solid ${ADMIN_COLORS.border}`,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
