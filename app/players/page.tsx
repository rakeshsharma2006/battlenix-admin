// app/players/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle, ChevronDown, ChevronUp, RefreshCw, Shield } from 'lucide-react';

import AdminShell from '@/components/AdminShell';
import { ADMIN_COLORS } from '@/lib/admin-utils';

interface FlagEntry {
  type: string;
  reason: string;
  severity: string;
  trustPenalty: number;
  createdAt: string;
}

interface FlaggedUser {
  _id: string;
  username: string;
  email: string;
  trustScore: number;
  isFlagged: boolean;
  isBanned: boolean;
  flags: FlagEntry[];
  updatedAt: string;
}

export default function PlayersPage() {
  const [users, setUsers] = useState<FlaggedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionUser, setActionUser] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadFlags = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/proxy/admin/flags?page=${page}&limit=20`, {
        credentials: 'include',
      });
      const data = await response.json();
      setUsers(data.flags ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadFlags();
  }, [loadFlags]);

  const handleReview = async (userId: string, action: 'clear' | 'ban') => {
    if (!adminNote.trim()) {
      window.alert('Please add an admin note');
      return;
    }

    setReviewing(userId);

    try {
      const response = await fetch(`/api/proxy/admin/flags/${userId}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNote }),
      });

      if (response.ok) {
        setActionUser(null);
        setAdminNote('');
        await loadFlags();
      }
    } catch {
      // Keep current review context available on failure.
    } finally {
      setReviewing(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return ADMIN_COLORS.error;
      case 'medium':
        return ADMIN_COLORS.warning;
      default:
        return ADMIN_COLORS.textSecondary;
    }
  };

  return (
    <AdminShell>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>
              Flagged Players
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: ADMIN_COLORS.textSecondary }}>
              {total} players flagged by anti-cheat system
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadFlags()}
            style={{
              padding: 10,
              borderRadius: 12,
              background: ADMIN_COLORS.bgCard,
              border: `1px solid ${ADMIN_COLORS.border}`,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} color={ADMIN_COLORS.textSecondary} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
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
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Shield size={48} style={{ margin: '0 auto 12px', opacity: 0.3, color: ADMIN_COLORS.success }} />
            <p style={{ margin: 0, color: ADMIN_COLORS.textSecondary }}>No flagged players</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: ADMIN_COLORS.textMuted }}>
              Anti-cheat system is running clean
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user._id}
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: ADMIN_COLORS.bgCard,
                  border: `1px solid ${user.isBanned ? 'rgba(239,68,68,0.3)' : ADMIN_COLORS.border}`,
                }}
              >
                <div className="p-4 flex items-center gap-4">
                  <div
                    className="flex"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      flexShrink: 0,
                      background: user.isBanned ? 'rgba(239,68,68,0.2)' : 'rgba(124,58,237,0.2)',
                    }}
                  >
                    {user.username[0]?.toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: ADMIN_COLORS.textPrimary, fontWeight: 600 }}>{user.username}</span>
                      {user.isBanned ? (
                        <span
                          style={{
                            fontSize: 12,
                            padding: '2px 8px',
                            borderRadius: 9999,
                            fontWeight: 700,
                            background: 'rgba(239,68,68,0.15)',
                            color: ADMIN_COLORS.error,
                          }}
                        >
                          BANNED
                        </span>
                      ) : null}
                      {user.isFlagged && !user.isBanned ? (
                        <span
                          style={{
                            fontSize: 12,
                            padding: '2px 8px',
                            borderRadius: 9999,
                            fontWeight: 700,
                            background: 'rgba(245,158,11,0.15)',
                            color: ADMIN_COLORS.warning,
                          }}
                        >
                          FLAGGED
                        </span>
                      ) : null}
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: ADMIN_COLORS.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </p>
                  </div>

                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: ADMIN_COLORS.textMuted }}>Trust</p>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 20,
                        color: user.trustScore < 40
                          ? ADMIN_COLORS.error
                          : user.trustScore < 70
                            ? ADMIN_COLORS.warning
                            : ADMIN_COLORS.success,
                      }}
                    >
                      {user.trustScore}
                    </p>
                  </div>

                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: ADMIN_COLORS.textMuted }}>Flags</p>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 20, color: ADMIN_COLORS.error }}>
                      {user.flags?.length ?? 0}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!user.isBanned ? (
                      <button
                        type="button"
                        onClick={() => setActionUser(actionUser === user._id ? null : user._id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 500,
                          background: ADMIN_COLORS.bgElevated,
                          color: ADMIN_COLORS.textSecondary,
                          border: `1px solid ${ADMIN_COLORS.border}`,
                          cursor: 'pointer',
                        }}
                      >
                        Review
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === user._id ? null : user._id)}
                      style={{
                        padding: 6,
                        borderRadius: 8,
                        background: ADMIN_COLORS.bgElevated,
                        border: `1px solid ${ADMIN_COLORS.border}`,
                        cursor: 'pointer',
                      }}
                    >
                      {expanded === user._id ? (
                        <ChevronUp size={16} color={ADMIN_COLORS.textSecondary} />
                      ) : (
                        <ChevronDown size={16} color={ADMIN_COLORS.textSecondary} />
                      )}
                    </button>
                  </div>
                </div>

                {actionUser === user._id ? (
                  <div
                    style={{
                      padding: '16px 16px 16px',
                      borderTop: `1px solid ${ADMIN_COLORS.border}`,
                    }}
                  >
                    <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 500, color: ADMIN_COLORS.textPrimary }}>
                      Admin Review Action
                    </p>
                    <textarea
                      value={adminNote}
                      onChange={(event) => setAdminNote(event.target.value)}
                      placeholder="Add admin note (required)..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 12,
                        fontSize: 14,
                        color: ADMIN_COLORS.textPrimary,
                        outline: 'none',
                        resize: 'none',
                        marginBottom: 12,
                        background: ADMIN_COLORS.bgElevated,
                        border: `1px solid ${ADMIN_COLORS.border}`,
                      }}
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => void handleReview(user._id, 'clear')}
                        disabled={reviewing === user._id}
                        className="flex items-center gap-2"
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 500,
                          background: 'rgba(16,185,129,0.1)',
                          color: ADMIN_COLORS.success,
                          border: '1px solid rgba(16,185,129,0.2)',
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle size={16} />
                        Clear Flag
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReview(user._id, 'ban')}
                        disabled={reviewing === user._id}
                        className="flex items-center gap-2"
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 500,
                          background: 'rgba(239,68,68,0.1)',
                          color: ADMIN_COLORS.error,
                          border: '1px solid rgba(239,68,68,0.2)',
                          cursor: 'pointer',
                        }}
                      >
                        <Ban size={16} />
                        Ban Player
                      </button>
                    </div>
                  </div>
                ) : null}

                {expanded === user._id && user.flags?.length > 0 ? (
                  <div
                    className="space-y-2"
                    style={{
                      padding: '12px 16px 16px',
                      borderTop: `1px solid ${ADMIN_COLORS.border}`,
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: ADMIN_COLORS.textMuted,
                      }}
                    >
                      Flag History
                    </p>
                    {user.flags.map((flag, index) => (
                      <div
                        key={`${flag.type}-${flag.createdAt}-${index}`}
                        className="flex items-start gap-3"
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          background: ADMIN_COLORS.bgElevated,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            marginTop: 6,
                            flexShrink: 0,
                            background: getSeverityColor(flag.severity),
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: getSeverityColor(flag.severity),
                              }}
                            >
                              {flag.severity}
                            </span>
                            <span style={{ fontSize: 12, color: ADMIN_COLORS.textMuted }}>
                              -{flag.trustPenalty} trust
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 14, color: ADMIN_COLORS.textPrimary }}>{flag.type}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: ADMIN_COLORS.textSecondary }}>
                            {flag.reason}
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: ADMIN_COLORS.textMuted }}>
                            {new Date(flag.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {total > 20 ? (
          <div className="flex justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                background: ADMIN_COLORS.bgCard,
                color: ADMIN_COLORS.textSecondary,
                border: `1px solid ${ADMIN_COLORS.border}`,
                cursor: 'pointer',
              }}
            >
              Previous
            </button>
            <span style={{ padding: '8px 16px', fontSize: 14, color: ADMIN_COLORS.textSecondary }}>
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              type="button"
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={page >= Math.ceil(total / 20)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                background: ADMIN_COLORS.bgCard,
                color: ADMIN_COLORS.textSecondary,
                border: `1px solid ${ADMIN_COLORS.border}`,
                cursor: 'pointer',
              }}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
