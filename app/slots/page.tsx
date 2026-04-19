// app/slots/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Clock, Plus, RefreshCw, Trash2, Trophy, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import AdminShell from '@/components/AdminShell';
import StatusBadge from '@/components/StatusBadge';
import { ADMIN_COLORS } from '@/lib/admin-utils';

interface Slot {
  _id: string;
  title: string;
  map: string;
  mode: string;
  entryFee: number;
  maxPlayers: number;
  playersCount: number;
  status: string;
  startTime: string;
  isExpired: boolean;
  isFull: boolean;
  fillPercent: number;
  prizeBreakdown: {
    playerPrize: number;
  };
}

interface CreateForm {
  map: 'Erangel' | 'Livik';
  mode: 'Solo' | 'Duo' | 'Squad';
  entryFee: 20 | 30 | 50 | 100;
  startTime: string;
}

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterMap, setFilterMap] = useState<'' | 'Erangel' | 'Livik'>('');
  const [filterMode, setFilterMode] = useState<'' | 'Solo' | 'Duo' | 'Squad'>('');
  const [form, setForm] = useState<CreateForm>({
    map: 'Erangel',
    mode: 'Solo',
    entryFee: 50,
    startTime: '',
  });

  const loadSlots = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (filterMap) {
        params.set('map', filterMap);
      }

      if (filterMode) {
        params.set('mode', filterMode);
      }

      const queryString = params.toString();
      const response = await fetch(
        `/api/proxy/admin/slots${queryString ? `?${queryString}` : ''}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Unable to load slots.');
        setSlots([]);
        return;
      }

      setSlots(data.slots || []);
    } catch {
      toast.error('Unable to load slots.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [filterMap, filterMode]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const createSlot = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.startTime) {
      toast.error('Please select a start time.');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/proxy/admin/slots/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startTime: new Date(form.startTime).toISOString(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.message || 'Unable to create slot.');
        return;
      }

      toast.success('Slot created successfully.');
      setShowForm(false);
      setForm({
        map: 'Erangel',
        mode: 'Solo',
        entryFee: 50,
        startTime: '',
      });
      await loadSlots();
    } catch {
      toast.error('Unable to create slot.');
    } finally {
      setCreating(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    const confirmed = window.confirm('Delete this slot?');

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/proxy/admin/slots/${slotId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.message || 'Unable to delete slot.');
        return;
      }

      toast.success('Slot deleted successfully.');
      await loadSlots();
    } catch {
      toast.error('Unable to delete slot.');
    }
  };

  return (
    <AdminShell>
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 style={{ margin: 0, color: ADMIN_COLORS.textPrimary, fontSize: 28, fontWeight: 700 }}>
              Slot Management
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: ADMIN_COLORS.textSecondary }}>
              Manage today&apos;s time-based match slots
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void loadSlots()}
              className="transition"
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
            <button
              type="button"
              onClick={() => setShowForm((currentValue) => !currentValue)}
              className="flex items-center gap-2"
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                fontWeight: 500,
                fontSize: 14,
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
              }}
            >
              <Plus size={16} />
              Create Slot
            </button>
          </div>
        </div>

        {showForm ? (
          <form
            onSubmit={createSlot}
            className="mb-6 p-6 rounded-2xl"
            style={{
              background: ADMIN_COLORS.bgCard,
              border: `1px solid ${ADMIN_COLORS.purple600}`,
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: ADMIN_COLORS.textPrimary, fontWeight: 600 }}>
              New Time Slot
            </h3>
            <div className="slot-form-grid">
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: ADMIN_COLORS.textSecondary,
                  }}
                >
                  Map
                </label>
                <select
                  value={form.map}
                  onChange={(event) => setForm((currentForm) => ({
                    ...currentForm,
                    map: event.target.value as CreateForm['map'],
                  }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 14,
                    background: ADMIN_COLORS.bgElevated,
                    border: `1px solid ${ADMIN_COLORS.border}`,
                    color: ADMIN_COLORS.textPrimary,
                    outline: 'none',
                  }}
                >
                  <option value="Erangel">Erangel</option>
                  <option value="Livik">Livik</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: ADMIN_COLORS.textSecondary,
                  }}
                >
                  Mode
                </label>
                <select
                  value={form.mode}
                  onChange={(event) => setForm((currentForm) => ({
                    ...currentForm,
                    mode: event.target.value as CreateForm['mode'],
                  }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 14,
                    background: ADMIN_COLORS.bgElevated,
                    border: `1px solid ${ADMIN_COLORS.border}`,
                    color: ADMIN_COLORS.textPrimary,
                    outline: 'none',
                  }}
                >
                  <option value="Solo">Solo</option>
                  <option value="Duo">Duo</option>
                  <option value="Squad">Squad</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: ADMIN_COLORS.textSecondary,
                  }}
                >
                  Fee
                </label>
                <select
                  value={form.entryFee}
                  onChange={(event) => setForm((currentForm) => ({
                    ...currentForm,
                    entryFee: Number(event.target.value) as CreateForm['entryFee'],
                  }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 14,
                    background: ADMIN_COLORS.bgElevated,
                    border: `1px solid ${ADMIN_COLORS.border}`,
                    color: ADMIN_COLORS.textPrimary,
                    outline: 'none',
                  }}
                >
                  <option value={20}>\u20B920</option>
                  <option value={30}>\u20B930</option>
                  <option value={50}>\u20B950</option>
                  <option value={100}>\u20B9100</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: ADMIN_COLORS.textSecondary,
                  }}
                >
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(event) => setForm((currentForm) => ({
                    ...currentForm,
                    startTime: event.target.value,
                  }))}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 14,
                    background: ADMIN_COLORS.bgElevated,
                    border: `1px solid ${ADMIN_COLORS.border}`,
                    color: ADMIN_COLORS.textPrimary,
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  background: ADMIN_COLORS.purple600,
                }}
              >
                {creating ? 'Creating...' : 'Create Slot'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
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
          </form>
        ) : null}

        <div className="flex gap-3 mb-6 flex-wrap">
          {(['', 'Erangel', 'Livik'] as const).map((map) => (
            <button
              key={map || 'all-maps'}
              type="button"
              onClick={() => setFilterMap(map)}
              className="transition"
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                background: filterMap === map ? ADMIN_COLORS.purple600 : ADMIN_COLORS.bgCard,
                color: filterMap === map ? '#FFFFFF' : ADMIN_COLORS.textSecondary,
                border: `1px solid ${filterMap === map ? ADMIN_COLORS.purple600 : ADMIN_COLORS.border}`,
              }}
            >
              {map || 'All Maps'}
            </button>
          ))}
          {(['', 'Solo', 'Duo', 'Squad'] as const).map((mode) => (
            <button
              key={mode || 'all-modes'}
              type="button"
              onClick={() => setFilterMode(mode)}
              className="transition"
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                background: filterMode === mode ? ADMIN_COLORS.purple600 : ADMIN_COLORS.bgCard,
                color: filterMode === mode ? '#FFFFFF' : ADMIN_COLORS.textSecondary,
                border: `1px solid ${filterMode === mode ? ADMIN_COLORS.purple600 : ADMIN_COLORS.border}`,
              }}
            >
              {mode || 'All Modes'}
            </button>
          ))}
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
        ) : slots.length === 0 ? (
          <div className="text-center py-12" style={{ color: ADMIN_COLORS.textSecondary }}>
            <Clock size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ margin: 0 }}>No slots found for today</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: ADMIN_COLORS.textMuted }}>
              Create slots for players to join
            </p>
          </div>
        ) : (
          <div className="slots-grid">
            {slots.map((slot) => (
              <div
                key={slot._id}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  background: ADMIN_COLORS.bgCard,
                  border: `1px solid ${
                    slot.isExpired || slot.isFull ? ADMIN_COLORS.border : 'rgba(124,58,237,0.3)'
                  }`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ margin: 0, color: ADMIN_COLORS.textPrimary, fontWeight: 600 }}>
                      {slot.map} · {slot.mode}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: ADMIN_COLORS.textSecondary }}>
                      {new Date(slot.startTime).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={slot.isExpired ? 'EXPIRED' : slot.isFull ? 'FULL' : slot.status}
                    />
                    {slot.playersCount === 0 ? (
                      <button
                        type="button"
                        onClick={() => void deleteSlot(slot._id)}
                        className="transition"
                        style={{
                          padding: 6,
                          borderRadius: 8,
                          border: 'none',
                          cursor: 'pointer',
                          background: 'rgba(239,68,68,0.08)',
                        }}
                      >
                        <Trash2 size={14} color={ADMIN_COLORS.error} />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} color={ADMIN_COLORS.textMuted} />
                    <span style={{ color: ADMIN_COLORS.textSecondary }}>
                      {slot.playersCount}/{slot.maxPlayers}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy size={14} color={ADMIN_COLORS.gold} />
                    <span style={{ color: ADMIN_COLORS.gold }}>
                      {`\u20B9${slot.prizeBreakdown?.playerPrize ?? 0}`}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '2px 8px',
                      borderRadius: 8,
                      background: 'rgba(245,158,11,0.1)',
                    }}
                  >
                    <span style={{ color: ADMIN_COLORS.gold, fontSize: 12 }}>{`\u20B9${slot.entryFee}`}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span style={{ fontSize: 12, color: ADMIN_COLORS.textMuted }}>Fill rate</span>
                    <span
                      style={{
                        fontSize: 12,
                        color: slot.fillPercent > 80 ? ADMIN_COLORS.error : ADMIN_COLORS.textMuted,
                      }}
                    >
                      {slot.fillPercent}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 9999,
                      overflow: 'hidden',
                      background: ADMIN_COLORS.bgElevated,
                    }}
                  >
                    <div
                      className="transition"
                      style={{
                        width: `${slot.fillPercent}%`,
                        height: '100%',
                        borderRadius: 9999,
                        background: slot.fillPercent > 80
                          ? ADMIN_COLORS.error
                          : 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .slot-form-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        @media (max-width: 1200px) {
          .slots-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .slot-form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .slots-grid,
          .slot-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AdminShell>
  );
}
