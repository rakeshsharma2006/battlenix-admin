// app/matches/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, RotateCcw, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import AdminShell from '@/components/AdminShell';
import DataTable, { type DataTableColumn } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { useMatches } from '@/hooks/useMatches';
import {
  ADMIN_COLORS,
  formatCurrency,
  formatMatchSchedule,
  normalizeMatchStatus,
} from '@/lib/admin-utils';
import type { Match } from '@/types';

const STATUS_OPTIONS: Array<{ value: 'all' | Lowercase<Match['status']>; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ready', label: 'Ready' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

type PublishModalState = {
  matchId: string;
  title: string;
} | null;

type MatchPlayerDetails = {
  _id?: string;
  username?: string | null;
  gameUid?: string | null;
  gameUID?: string | null;
  gameName?: string | null;
  upiId?: string | null;
  bgmiUID?: string | null;
  bgmiName?: string | null;
  bgmiUpiId?: string | null;
  ffUID?: string | null;
  ffName?: string | null;
  ffUpiId?: string | null;
  trustScore?: number | null;
  isFlagged?: boolean | null;
};

type MatchPlayerApiShape = MatchPlayerDetails & {
  userId?: MatchPlayerDetails | string | null;
};

type MatchPlayer = {
  _id: string;
  username?: string | null;
  gameUid?: string | null;
  gameName?: string | null;
  upiId?: string | null;
  trustScore: number;
  isFlagged: boolean;
  userId?: MatchPlayerDetails | null;
};

const gameSpecificValue = (
  candidate: MatchPlayerDetails,
  nestedUser: MatchPlayerDetails | null,
  game: string | undefined,
  field: 'uid' | 'name' | 'upi',
) => {
  const isFreeFire = game === 'FREE_FIRE';

  if (field === 'uid') {
    return isFreeFire
      ? candidate.ffUID ?? nestedUser?.ffUID ?? candidate.gameUID ?? candidate.gameUid ?? nestedUser?.gameUID ?? nestedUser?.gameUid ?? null
      : candidate.bgmiUID ?? nestedUser?.bgmiUID ?? candidate.gameUID ?? candidate.gameUid ?? nestedUser?.gameUID ?? nestedUser?.gameUid ?? null;
  }

  if (field === 'name') {
    return isFreeFire
      ? candidate.ffName ?? nestedUser?.ffName ?? candidate.gameName ?? nestedUser?.gameName ?? null
      : candidate.bgmiName ?? nestedUser?.bgmiName ?? candidate.gameName ?? nestedUser?.gameName ?? null;
  }

  return isFreeFire
    ? candidate.ffUpiId ?? nestedUser?.ffUpiId ?? candidate.upiId ?? nestedUser?.upiId ?? null
    : candidate.bgmiUpiId ?? nestedUser?.bgmiUpiId ?? candidate.upiId ?? nestedUser?.upiId ?? null;
};

const normalizeMatchPlayer = (player: unknown, index: number, game?: string): MatchPlayer => {
  const candidate: MatchPlayerApiShape =
    player && typeof player === 'object' ? (player as MatchPlayerApiShape) : {};

  const nestedUser =
    candidate.userId && typeof candidate.userId === 'object' && !Array.isArray(candidate.userId)
      ? candidate.userId
      : null;

  const playerId =
    candidate._id ??
    nestedUser?._id ??
    (typeof candidate.userId === 'string' ? candidate.userId : null) ??
    `player-${index}`;

  const trustScore =
    typeof candidate.trustScore === 'number'
      ? candidate.trustScore
      : typeof nestedUser?.trustScore === 'number'
        ? nestedUser.trustScore
        : 0;

  return {
    _id: String(playerId),
    username: candidate.username ?? nestedUser?.username ?? null,
    gameUid: gameSpecificValue(candidate, nestedUser, game, 'uid'),
    gameName: gameSpecificValue(candidate, nestedUser, game, 'name'),
    upiId: gameSpecificValue(candidate, nestedUser, game, 'upi'),
    trustScore,
    isFlagged: Boolean(candidate.isFlagged ?? nestedUser?.isFlagged ?? false),
    userId: nestedUser,
  };
};

export default function MatchesPage() {
  const router = useRouter();
  const { matches, loading, error, refetch, updateStatus } = useMatches();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Lowercase<Match['status']>>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [publishModal, setPublishModal] = useState<PublishModalState>(null);
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [playersModal, setPlayersModal] = useState<{
    matchId: string;
    title: string;
    players: MatchPlayer[];
  } | null>(null);

  const [declareModal, setDeclareModal] = useState<{
    matchId: string;
    title: string;
    players: { _id: string; username: string }[];
    prizeAmount: number;
  } | null>(null);

  const [markPaidModal, setMarkPaidModal] = useState<{
    matchId: string;
    title: string;
    winnerName: string;
    upiId: string;
    prizeAmount: number;
  } | null>(null);

  const [selectedWinner, setSelectedWinner] = useState('');
  const [declareNotes, setDeclareNotes] = useState('');
  const [paidNotes, setPaidNotes] = useState('');
  const [declaring, setDeclaring] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const pageRef = useRef<HTMLDivElement | null>(null);

  const deleteMatch = async (matchId: string) => {
    const confirmed = window.confirm(
      'Delete this match permanently? This cannot be undone.'
    );
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/proxy/matches/${matchId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Match deleted successfully');
        await refetch();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || 'Delete failed');
      }
    } catch {
      toast.error('Error deleting match');
    }
  };

  const toggleChat = async (matchId: string, currentChatEnabled: boolean) => {
    try {
      const res = await fetch(`/api/proxy/matches/${matchId}/chat-toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentChatEnabled }),
      });
      if (res.ok) {
        toast.success(`Chat ${!currentChatEnabled ? 'enabled' : 'disabled'}!`);
        await refetch();
      } else {
        toast.error('Failed to toggle chat');
      }
    } catch {
      toast.error('Error toggling chat');
    }
  };

  const handleMarkReady = async (matchId: string) => {
    setProcessingId(matchId);
    try {
      const res = await fetch(`/api/proxy/matches/${matchId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'READY' }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message || 'Failed to mark ready');
        return;
      }

      toast.success('Match marked as READY!');
      await refetch();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setProcessingId(null);
    }
  };


  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!pageRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const filteredMatches = matches.filter((match) => {
    const normalizedStatus = normalizeMatchStatus(match.status);
    const matchesSearch = match.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Matches refreshed.');
    } catch {
      // Hook already handles the error state and toast.
    }
  };

  const handleStatusChange = async (
    match: Match,
    nextStatus: Extract<Lowercase<Match['status']>, 'live' | 'completed' | 'cancelled'>
  ) => {
    const confirmed = window.confirm(
      `Change "${match.title}" to ${nextStatus.replace('_', ' ')} status?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(match._id);
    setOpenMenuId(null);

    try {
      const normalizedStatus = nextStatus.toUpperCase() as Match['status'];
      await updateStatus(match._id, normalizedStatus);
      toast.success(`Match updated to ${normalizedStatus}.`);
    } catch {
      // Hook already handles the error state and toast.
    } finally {
      setProcessingId(null);
    }
  };

  const publishRoom = async () => {
    if (!publishModal || !roomId || !roomPassword) {
      return;
    }

    setPublishing(true);

    try {
      const response = await fetch(`/api/proxy/matches/${publishModal.matchId}/publish-room`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, roomPassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.message || 'Unable to publish room.');
        return;
      }

      toast.success('Room published successfully.');
      setPublishModal(null);
      setRoomId('');
      setRoomPassword('');
      await refetch();
    } catch {
      toast.error('Unable to publish room.');
    } finally {
      setPublishing(false);
    }
  };

  const closePublishModal = () => {
    setPublishModal(null);
    setRoomId('');
    setRoomPassword('');
    setPublishing(false);
  };

  const loadMatchPlayers = async (match: Match) => {
    setLoadingPlayers(true);
    try {
      const res = await fetch(`/api/proxy/matches/${match._id}/players`, { credentials: 'include' });
      const data = await res.json();
      console.log('Players data:', data);

      if (!res.ok) {
        toast.error(data.message || 'Failed to load players');
        return;
      }

      const playersSource = Array.isArray(data)
        ? data
        : data.players ?? data.match?.players ?? data.data?.players ?? [];

      const detailedPlayers = Array.isArray(playersSource)
        ? playersSource.map((player, index) => normalizeMatchPlayer(player, index, match.game))
        : [];

      setPlayersModal({
        matchId: match._id,
        title: match.title,
        players: detailedPlayers,
      });
    } catch {
      toast.error('Failed to load players');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const openDeclareModal = async (match: Match) => {
    setLoadingPlayers(true);
    try {
      const res = await fetch(`/api/proxy/matches/${match._id}`, {
        credentials: 'include',
      });
      const data = await res.json();
      const players = data.match?.players ?? [];
      setDeclareModal({
        matchId: match._id,
        title: match.title,
        players,
        prizeAmount: match.prizeBreakdown?.playerPrize ?? 0,
      });
      setSelectedWinner('');
      setDeclareNotes('');
    } catch {
      toast.error('Failed to load match players');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const declareWinner = async () => {
    if (!selectedWinner || !declareModal) return;
    setDeclaring(true);
    try {
      const res = await fetch(`/api/proxy/admin/matches/${declareModal.matchId}/declare-winner`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: selectedWinner,
          prizeAmount: declareModal.prizeAmount,
          notes: declareNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to declare winner');
        return;
      }
      toast.success('Winner declared! Payment pending.');
      setDeclareModal(null);
      await refetch();
    } catch {
      toast.error('Network error');
    } finally {
      setDeclaring(false);
    }
  };

  const markAsPaid = async () => {
    if (!markPaidModal) return;
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/proxy/admin/matches/${markPaidModal.matchId}/mark-paid`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: paidNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to mark as paid');
        return;
      }
      toast.success('Payment marked as paid!');
      setMarkPaidModal(null);
      await refetch();
    } catch {
      toast.error('Network error');
    } finally {
      setMarkingPaid(false);
    }
  };

  const tableColumns: DataTableColumn<Match>[] = [
    {
      key: 'title',
      label: 'Title',
      render: (match) => (
        <span style={{ color: ADMIN_COLORS.textPrimary, fontWeight: 600 }}>{match.title}</span>
      ),
    },
    {
      key: 'game',
      label: 'Game',
      render: (match) => <span style={{ color: ADMIN_COLORS.textSecondary }}>{match.game}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (match) => <StatusBadge status={match.status} variant="match" />,
    },
    {
      key: 'entryFee',
      label: 'Entry Fee',
      render: (match) => <span>{formatCurrency(match.entryFee)}</span>,
    },
    {
      key: 'prizePool',
      label: 'Prize Pool',
      render: (match) => <span style={{ color: ADMIN_COLORS.gold }}>{formatCurrency(match.prizeBreakdown?.playerPrize ?? 0)}</span>,
    },
    {
      key: 'players',
      label: 'Players',
      render: (match) => <span>{`${match.playersCount}/${match.maxPlayers}`}</span>,
    },
    {
      key: 'scheduledAt',
      label: 'Scheduled',
      render: (match) => (
        <span style={{ color: ADMIN_COLORS.textSecondary }}>{formatMatchSchedule(match.startTime)}</span>
      ),
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (match) => {
        if (!match.paymentStatus || match.paymentStatus === 'NOT_APPLICABLE') {
          return <span style={{ color: ADMIN_COLORS.textMuted }}>-</span>;
        }
        if (match.paymentStatus === 'PENDING') {
          return <span style={{ color: ADMIN_COLORS.warning, fontSize: 12, fontWeight: 600 }}>Payout Pending</span>;
        }
        if (match.paymentStatus === 'PAID') {
          return <span style={{ color: ADMIN_COLORS.success, fontSize: 12, fontWeight: 600 }}>Paid ✓</span>;
        }
        return <span style={{ color: ADMIN_COLORS.textSecondary }}>{match.paymentStatus}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (match) => {
        const normalizedStatus = normalizeMatchStatus(match.status);
        const actions: Array<{
          label: string;
          status: Extract<Lowercase<Match['status']>, 'live' | 'completed' | 'cancelled'>;
          color: string;
        }> = [];

        if (normalizedStatus === 'ready') {
          actions.push({ label: 'Mark Live', status: 'live', color: ADMIN_COLORS.success });
        }

        if (normalizedStatus === 'live') {
          actions.push({
            label: 'Mark Completed',
            status: 'completed',
            color: ADMIN_COLORS.purple400,
          });
        }

        if (normalizedStatus !== 'completed' && normalizedStatus !== 'cancelled') {
          actions.push({ label: 'Cancel Match', status: 'cancelled', color: ADMIN_COLORS.error });
        }

        const isOpen = openMenuId === match._id;
        const isProcessing = processingId === match._id;
        const canPublishRoom = normalizedStatus === 'ready';
        const canSubmitResult = normalizedStatus === 'live';
        const canOpenChat = normalizedStatus === 'completed';
        const isCompletedOrCancelled = normalizedStatus === 'completed' || normalizedStatus === 'cancelled';
        const chatEnabled = match.chatEnabled ?? true;

        return (
          <div className="flex" style={{ position: 'relative', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            {normalizedStatus === 'upcoming' && (
              <div className="flex flex-col items-end mr-2">
                <button
                  type="button"
                  onClick={() => void handleMarkReady(match._id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    color: '#F59E0B',
                    border: '1px solid rgba(245,158,11,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Mark Ready
                </button>
              </div>
            )}

            <button
              onClick={() => toggleChat(match._id, chatEnabled)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: chatEnabled ? 'rgba(22,163,74,0.1)' : 'rgba(75,85,99,0.1)',
                color: chatEnabled ? '#16A34A' : '#9CA3AF',
                border: chatEnabled ? '1px solid rgba(22,163,74,0.2)' : '1px solid rgba(75,85,99,0.2)',
              }}
            >
              {chatEnabled ? '💬 Chat ON' : '🔇 Chat OFF'}
            </button>

            {isCompletedOrCancelled && (
              <button
                onClick={() => deleteMatch(match._id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'rgba(153,27,27,0.1)',
                  color: '#EF4444',
                  border: '1px solid rgba(153,27,27,0.2)',
                }}
              >
                🗑️ Delete
              </button>
            )}

            {canSubmitResult ? (
              <button
                type="button"
                onClick={() => router.push(`/matches/${match._id}/result`)}
                className="transition"
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: 'rgba(245,158,11,0.1)',
                  color: ADMIN_COLORS.warning,
                  border: '1px solid rgba(245,158,11,0.2)',
                }}
              >
                Submit Result
              </button>
            ) : null}

            {canOpenChat ? (
              <button
                type="button"
                onClick={() => router.push(`/chat/${match._id}`)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: 'rgba(124,58,237,0.1)',
                  color: '#A78BFA',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}
              >
                💬 Chat
              </button>
            ) : null}

            {['READY', 'LIVE', 'COMPLETED'].includes(match.status) && (
              <button
                onClick={() => void loadMatchPlayers(match)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                style={{
                  background: 'rgba(124,58,237,0.1)',
                  color: '#A78BFA',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}>
                👥 Players
              </button>
            )}

            {canPublishRoom ? (
              <button
                type="button"
                onClick={() => setPublishModal({ matchId: match._id, title: match.title })}
                className="transition"
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'rgba(16,185,129,0.1)',
                  color: ADMIN_COLORS.success,
                  border: '1px solid rgba(16,185,129,0.2)',
                }}
              >
                Publish Room
              </button>
            ) : null}

            {normalizedStatus === 'completed' && match.paymentStatus !== 'PAID' && (
              <button
                type="button"
                onClick={() => void openDeclareModal(match)}
                disabled={loadingPlayers}
                className="transition"
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: loadingPlayers ? 'not-allowed' : 'pointer',
                  background: 'rgba(245,158,11,0.1)',
                  color: ADMIN_COLORS.warning,
                  border: '1px solid rgba(245,158,11,0.2)',
                }}
              >
                🏆 Declare Winner
              </button>
            )}

            {normalizedStatus === 'completed' && match.paymentStatus === 'PENDING' && (
              <button
                type="button"
                onClick={() => setMarkPaidModal({
                  matchId: match._id,
                  title: match.title,
                  winnerName: (typeof match.declaredWinnerId === 'object' && match.declaredWinnerId !== null) ? match.declaredWinnerId.username : 'Unknown',
                  upiId: match.winnerUpiId ?? '',
                  prizeAmount: match.prizeAmount ?? 0,
                })}
                className="transition"
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'rgba(16,185,129,0.1)',
                  color: ADMIN_COLORS.success,
                  border: '1px solid rgba(16,185,129,0.2)',
                }}
              >
                💸 Mark Paid
              </button>
            )}

            {match.paymentStatus === 'PAID' && (
              <span style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(16,185,129,0.08)',
                color: ADMIN_COLORS.success,
                border: '1px solid rgba(16,185,129,0.15)',
              }}>
                ✓ Paid
              </span>
            )}

            {actions.length ? (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenuId((currentId) => (currentId === match._id ? null : match._id));
                  }}
                  disabled={isProcessing}
                  className="transition cursor-pointer flex"
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    height: 34,
                    padding: '0 12px',
                    borderRadius: 8,
                    background: ADMIN_COLORS.bgElevated,
                    border: `1px solid ${ADMIN_COLORS.border}`,
                    color: ADMIN_COLORS.textPrimary,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {isProcessing ? (
                    <span
                      className="animate-spin"
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                      }}
                    />
                  ) : (
                    <>
                      <span>Update</span>
                      <ChevronDown size={14} />
                    </>
                  )}
                </button>

                {isOpen ? (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: 40,
                      right: 0,
                      width: 180,
                      background: ADMIN_COLORS.bgSurface,
                      border: `1px solid ${ADMIN_COLORS.border}`,
                      borderRadius: 12,
                      boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                      overflow: 'hidden',
                      zIndex: 20,
                    }}
                  >
                    {actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => void handleStatusChange(match, action.status)}
                        className="menu-item transition cursor-pointer"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          border: 'none',
                          background: 'transparent',
                          color: action.color,
                          textAlign: 'left',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <AdminShell>
      <div ref={pageRef} className="flex" style={{ flexDirection: 'column', gap: 20 }}>
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

        <div className="matches-filter-bar flex">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              color={ADMIN_COLORS.textMuted}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by match title"
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
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | Lowercase<Match['status']>)}
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
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="flex transition cursor-pointer"
            style={{
              height: 42,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '0 14px',
              borderRadius: 10,
              border: `1px solid ${ADMIN_COLORS.border}`,
              background: ADMIN_COLORS.bgCard,
              color: ADMIN_COLORS.textPrimary,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <DataTable
          columns={tableColumns}
          data={filteredMatches}
          loading={loading}
          emptyMessage="No matches found for the selected filters."
        />
      </div>

      {publishModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 448,
              padding: 24,
              borderRadius: 16,
              background: ADMIN_COLORS.bgCard,
              border: `1px solid ${ADMIN_COLORS.border}`,
            }}
          >
            <h3
              style={{
                margin: '0 0 8px',
                color: ADMIN_COLORS.textPrimary,
                fontWeight: 600,
                fontSize: 20,
              }}
            >
              Publish Room
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: ADMIN_COLORS.textSecondary }}>
              {publishModal.title}
            </p>
            <div className="space-y-4">
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: ADMIN_COLORS.textSecondary,
                  }}
                >
                  Room ID
                </label>
                <input
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  placeholder="Enter BGMI Room ID"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    fontSize: 14,
                    background: ADMIN_COLORS.bgElevated,
                    border: `1px solid ${ADMIN_COLORS.border}`,
                    color: ADMIN_COLORS.textPrimary,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: ADMIN_COLORS.textSecondary,
                  }}
                >
                  Room Password
                </label>
                <input
                  value={roomPassword}
                  onChange={(event) => setRoomPassword(event.target.value)}
                  placeholder="Enter Room Password"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    fontSize: 14,
                    background: ADMIN_COLORS.bgElevated,
                    border: `1px solid ${ADMIN_COLORS.border}`,
                    color: ADMIN_COLORS.textPrimary,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => void publishRoom()}
                disabled={publishing}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: publishing ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                }}
              >
                {publishing ? 'Publishing...' : 'Publish & Go Live'}
              </button>
              <button
                type="button"
                onClick={closePublishModal}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 500,
                  color: ADMIN_COLORS.textSecondary,
                  background: ADMIN_COLORS.bgElevated,
                  border: `1px solid ${ADMIN_COLORS.border}`,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {declareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#13131E', border: '1px solid #1E2035' }}>
            
            {/* Header */}
            <div className="p-6" style={{ borderBottom: '1px solid #1E2035' }}>
              <h3 className="text-white font-bold text-lg">Declare Winner</h3>
              <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                {declareModal.title}
              </p>
            </div>

            {/* Prize info */}
            <div className="px-6 pt-4">
              <div className="p-3 rounded-xl flex items-center justify-between mb-4"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <span className="text-sm" style={{ color: '#94A3B8' }}>Prize Amount</span>
                <span className="font-bold text-lg" style={{ color: '#F59E0B' }}>
                  ₹{declareModal.prizeAmount}
                </span>
              </div>
            </div>

            {/* Players list */}
            <div className="px-6 pb-2">
              <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Select Winner</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {declareModal.players.length === 0 ? (
                  <p className="text-sm" style={{ color: '#475569' }}>No players found</p>
                ) : (
                  declareModal.players.map((player) => {
                    const pid = player._id;
                    const pname = player.username;
                    return (
                      <label key={pid}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: selectedWinner === pid
                            ? 'rgba(245,158,11,0.1)'
                            : '#1A1A28',
                          border: `1px solid ${selectedWinner === pid
                            ? 'rgba(245,158,11,0.3)'
                            : '#1E2035'}`,
                        }}>
                        <input
                          type="radio"
                          name="winner"
                          value={pid}
                          checked={selectedWinner === pid}
                          onChange={() => setSelectedWinner(pid)}
                          className="accent-yellow-500"
                        />
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                          style={{ background: '#7C3AED' }}>
                          {pname[0]?.toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{pname}</span>
                        {selectedWinner === pid && (
                          <span className="ml-auto text-xs font-bold" style={{ color: '#F59E0B' }}>🏆 Winner</span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="px-6 pt-3">
              <textarea
                value={declareNotes}
                onChange={e => setDeclareNotes(e.target.value)}
                placeholder="Add notes (optional)..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none"
                style={{ background: '#1A1A28', border: '1px solid #1E2035' }}
              />
            </div>

            {/* Actions */}
            <div className="p-6 flex gap-3">
              <button
                type="button"
                onClick={() => void declareWinner()}
                disabled={!selectedWinner || declaring}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                style={{
                  background: !selectedWinner || declaring
                    ? '#4B5563'
                    : 'linear-gradient(135deg, #F59E0B, #D97706)',
                  boxShadow: selectedWinner && !declaring
                    ? '0 4px 20px rgba(245,158,11,0.3)'
                    : 'none',
                  border: 'none',
                }}>
                {declaring ? 'Declaring...' : '🏆 Declare Winner'}
              </button>
              <button
                type="button"
                onClick={() => setDeclareModal(null)}
                className="px-6 py-3 rounded-xl font-medium text-sm cursor-pointer"
                style={{ background: '#1A1A28', color: '#94A3B8', border: '1px solid #1E2035' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {markPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#13131E', border: '1px solid #1E2035' }}>

            {/* Header */}
            <div className="p-6" style={{ borderBottom: '1px solid #1E2035' }}>
              <h3 className="text-white font-bold text-lg">Mark Payment as Paid</h3>
              <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                {markPaidModal.title}
              </p>
            </div>

            {/* Winner details */}
            <div className="p-6 space-y-3">
              <div className="p-4 rounded-xl" style={{ background: '#1A1A28', border: '1px solid #1E2035' }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs uppercase tracking-wider" style={{ color: '#475569' }}>Winner</span>
                  <span className="text-white font-semibold">
                    {markPaidModal.winnerName}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs uppercase tracking-wider" style={{ color: '#475569' }}>Prize</span>
                  <span className="font-bold" style={{ color: '#F59E0B' }}>
                    ₹{markPaidModal.prizeAmount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider" style={{ color: '#475569' }}>UPI ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-white">
                      {markPaidModal.upiId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(markPaidModal.upiId);
                        toast.success('UPI ID copied!');
                      }}
                      className="px-2 py-1 rounded-lg text-xs font-medium cursor-pointer"
                      style={{
                        background: 'rgba(124,58,237,0.15)',
                        color: '#A78BFA',
                        border: '1px solid rgba(124,58,237,0.3)',
                      }}>
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p className="text-xs" style={{ color: '#F59E0B' }}>
                  ⚠️ Make sure you have sent ₹{markPaidModal.prizeAmount} to{' '}
                  <strong>{markPaidModal.upiId}</strong> via PhonePe/GPay before marking as paid.
                </p>
              </div>

              {/* Notes */}
              <textarea
                value={paidNotes}
                onChange={e => setPaidNotes(e.target.value)}
                placeholder="Add payment reference or notes (optional)..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none"
                style={{ background: '#1A1A28', border: '1px solid #1E2035' }}
              />
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => void markAsPaid()}
                disabled={markingPaid}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                style={{
                  background: markingPaid
                    ? '#4B5563'
                    : 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: !markingPaid
                    ? '0 4px 20px rgba(16,185,129,0.3)'
                    : 'none',
                  border: 'none',
                }}>
                {markingPaid
                  ? 'Processing...'
                  : '✓ I have sent payment — Mark as Paid'}
              </button>
              <button
                type="button"
                onClick={() => setMarkPaidModal(null)}
                className="px-6 py-3 rounded-xl font-medium text-sm cursor-pointer"
                style={{ background: '#1A1A28', color: '#94A3B8', border: '1px solid #1E2035' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {playersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
            style={{ background: '#13131E', border: '1px solid #1E2035' }}>

            {/* Header */}
            <div className="p-6 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid #1E2035' }}>
              <div>
                <h3 className="text-white font-bold text-lg">Match Players</h3>
                <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
                  {playersModal.title} · {playersModal.players.length} players
                </p>
              </div>
              <button
                onClick={() => setPlayersModal(null)}
                className="p-2 rounded-xl cursor-pointer"
                style={{ background: '#1A1A28', border: '1px solid #1E2035' }}>
                <span className="text-white text-lg">✕</span>
              </button>
            </div>

            {/* Players list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {playersModal.players.length === 0 ? (
                <div className="text-center py-8">
                  <p style={{ color: '#94A3B8' }}>No players have joined yet</p>
                </div>
              ) : (
                playersModal.players.map((player, index) => {
                  const username = player.username || player.userId?.username || '—';
                  const gameUid = player.gameUid || player.userId?.gameUid || player.userId?.gameUID || '—';
                  const gameName = player.gameName || player.userId?.gameName || '—';
                  const upiId = player.upiId || player.userId?.upiId || null;

                  return (
                    <div key={player._id} className="p-4 rounded-xl"
                    style={{
                      background: '#1A1A28',
                      border: `1px solid ${player.isFlagged ? 'rgba(239,68,68,0.3)' : '#1E2035'}`,
                    }}>
                    <div className="flex items-start gap-4">
                      {/* Number */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                        style={{ background: '#7C3AED' }}>
                        {index + 1}
                      </div>

                      {/* Info grid */}
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        {/* Username */}
                        <div>
                          <p className="text-xs uppercase tracking-wider mb-1"
                            style={{ color: '#475569' }}>Username</p>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold">{username}</p>
                            {player.isFlagged && (
                              <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                                ⚠️ Flagged
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Trust Score */}
                        <div>
                          <p className="text-xs uppercase tracking-wider mb-1"
                            style={{ color: '#475569' }}>Trust Score</p>
                          <p className="font-bold"
                            style={{
                              color: player.trustScore < 40
                                ? '#EF4444'
                                : player.trustScore < 70
                                  ? '#F59E0B'
                                  : '#10B981'
                            }}>
                            {player.trustScore}/100
                          </p>
                        </div>

                        {/* Game UID */}
                        <div>
                          <p className="text-xs uppercase tracking-wider mb-1"
                            style={{ color: '#475569' }}>Game UID</p>
                          <p className="font-mono text-sm"
                            style={{ color: gameUid !== '—' ? '#F1F5F9' : '#475569' }}>
                            {gameUid}
                          </p>
                        </div>

                        {/* Game Name */}
                        <div>
                          <p className="text-xs uppercase tracking-wider mb-1"
                            style={{ color: '#475569' }}>Game Name</p>
                          <p className="text-sm"
                            style={{ color: gameName !== '—' ? '#F1F5F9' : '#475569' }}>
                            {gameName}
                          </p>
                        </div>

                        {/* UPI ID */}
                        <div className="col-span-2">
                          <p className="text-xs uppercase tracking-wider mb-1"
                            style={{ color: '#475569' }}>UPI ID</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm"
                              style={{ color: upiId ? '#F1F5F9' : '#475569' }}>
                              {upiId || 'Not set'}
                            </p>
                            {upiId && (
                              <button
                                onClick={() => {
                                  void navigator.clipboard.writeText(upiId);
                                  toast.success('UPI copied!');
                                }}
                                className="px-2 py-0.5 rounded text-xs cursor-pointer"
                                style={{
                                  background: 'rgba(124,58,237,0.1)',
                                  color: '#A78BFA',
                                  border: '1px solid rgba(124,58,237,0.2)',
                                }}>
                                Copy
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 flex-shrink-0"
              style={{ borderTop: '1px solid #1E2035' }}>
              <button
                onClick={() => setPlayersModal(null)}
                className="w-full py-3 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: '#1A1A28', color: '#94A3B8', border: '1px solid #1E2035' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .matches-filter-bar {
          gap: 12px;
          align-items: center;
        }

        .menu-item:hover {
          background: #13131e !important;
        }

        @media (max-width: 768px) {
          .matches-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </AdminShell>
  );
}
