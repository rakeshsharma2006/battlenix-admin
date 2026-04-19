'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Trophy } from 'lucide-react';

// Game config matching backend exactly
const GAME_CONFIG = {
  BGMI: {
    maps: {
      Erangel: { maxPlayers: 100 },
      Livik: { maxPlayers: 52 },
    },
    prizes: {
      100: {
        20: { playerPrize: 1300, managerCut: 200, adminCut: 500 },
        30: { playerPrize: 2000, managerCut: 250, adminCut: 750 },
        50: { playerPrize: 3700, managerCut: 300, adminCut: 1000 },
        100: { playerPrize: 7500, managerCut: 500, adminCut: 2000 },
      },
      52: {
        20: { playerPrize: 540, managerCut: 200, adminCut: 300 },
        30: { playerPrize: 1000, managerCut: 200, adminCut: 360 },
        50: { playerPrize: 1800, managerCut: 300, adminCut: 500 },
        100: { playerPrize: 4000, managerCut: 300, adminCut: 900 },
      },
    },
  },
  FREE_FIRE: {
    maps: {
      Bermuda: { maxPlayers: 52 },
      Purgatory: { maxPlayers: 52 },
      Kalahari: { maxPlayers: 52 },
    },
    prizes: {
      52: {
        20: { playerPrize: 540, managerCut: 200, adminCut: 300 },
        30: { playerPrize: 1000, managerCut: 200, adminCut: 360 },
        50: { playerPrize: 1800, managerCut: 300, adminCut: 500 },
        100: { playerPrize: 4000, managerCut: 300, adminCut: 900 },
      },
    },
  },
} as const;

type Game = keyof typeof GAME_CONFIG;
type Mode = 'Solo' | 'Duo' | 'Squad';
const MODES: Mode[] = ['Solo', 'Duo', 'Squad'];
const ENTRY_FEES = [20, 30, 50, 100] as const;
const MODE_TEAM_SIZE: Record<Mode, number> = { Solo: 1, Duo: 2, Squad: 4 };

export default function CreateMatchPage() {
  const router = useRouter();

  const [game, setGame] = useState<Game>('BGMI');
  const [map, setMap] = useState<string>('Erangel');
  const [mode, setMode] = useState<Mode>('Solo');
  const [entryType, setEntryType] = useState<'FREE' | 'PAID'>('PAID');
  const [entryFee, setEntryFee] = useState<number>(50);
  const [startTime, setStartTime] = useState('');
  const [title, setTitle] = useState('');
  
  const [useCustomPrize, setUseCustomPrize] = useState(false);
  const [customPrize, setCustomPrize] = useState('');
  
  const [maxPlayers, setMaxPlayers] = useState(100);
  const [useCustomLimit, setUseCustomLimit] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // When game changes, reset map to first available
  const handleGameChange = (newGame: Game) => {
    setGame(newGame);
    const firstMap = Object.keys(GAME_CONFIG[newGame].maps)[0];
    setMap(firstMap);
    setMaxPlayers((GAME_CONFIG[newGame].maps as any)[firstMap]?.maxPlayers ?? 100);
    setUseCustomLimit(false);
  };

  const currentMaps = GAME_CONFIG[game].maps;
  // Fallback to default max players if custom limit is not set
  const mapMaxPlayers = (currentMaps as any)[map]?.maxPlayers ?? 100;
  // If not using custom limit, use the map's default
  // Wait, if map changes, we should update maxPlayers if not custom
  const actualMaxPlayers = useCustomLimit ? maxPlayers : mapMaxPlayers;
  
  const prizes = (GAME_CONFIG[game].prizes as any)[actualMaxPlayers]?.[entryFee] ?? {
    playerPrize: 0, managerCut: 0, adminCut: 0
  };
  
  const displayPrize = useCustomPrize && customPrize ? Number(customPrize) : 
                       (entryType === 'FREE' ? 0 : prizes.playerPrize);

  const teamSize = MODE_TEAM_SIZE[mode];
  const prizePerMember = Math.floor(displayPrize / teamSize);
  const totalCollection = entryType === 'FREE' ? 0 : entryFee * actualMaxPlayers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime) { setError('Please select start time'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/proxy/matches', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game,
          map,
          mode,
          entryType,
          entryFee: entryType === 'FREE' ? 0 : entryFee,
          maxPlayers: actualMaxPlayers,
          startTime: new Date(startTime).toISOString(),
          title: title.trim() || undefined,
          customPrize: useCustomPrize ? Number(customPrize) : undefined,
          prizeBreakdown: entryType === 'FREE' 
            ? {
                playerPrize: useCustomPrize ? Number(customPrize) : 0,
                managerCut: 0,
                adminCut: 0,
              }
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || JSON.stringify(data.errors) || 'Failed');
        return;
      }

      setSuccess('Match created!');
      setTimeout(() => router.push('/matches'), 1500);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const card = {
    background: '#13131E',
    border: '1px solid #1E2035',
    borderRadius: 16,
    padding: 20,
  };

  const selected = {
    background: 'rgba(124,58,237,0.15)',
    border: '1.5px solid #7C3AED',
    borderRadius: 12,
    cursor: 'pointer',
    padding: '12px 16px',
  };

  const unselected = {
    background: '#1A1A28',
    border: '1px solid #1E2035',
    borderRadius: 12,
    cursor: 'pointer',
    padding: '12px 16px',
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl"
            style={{ background: '#13131E', border: '1px solid #1E2035' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Match</h1>
            <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
              Set up a tournament slot
            </p>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Check className="w-5 h-5" style={{ color: '#10B981' }} />
            <p style={{ color: '#10B981' }}>{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ color: '#EF4444' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT */}
            <div className="lg:col-span-2 space-y-6">

              {/* Game Selection */}
              <div style={card}>
                <h2 className="text-white font-semibold mb-4">Select Game</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(GAME_CONFIG) as Game[]).map(g => (
                    <button key={g} type="button"
                      onClick={() => handleGameChange(g)}
                      style={game === g ? selected : unselected}>
                      <p className="text-white font-medium">
                        {g === 'BGMI' ? '🎮 BGMI' : '🔥 Free Fire'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                        {Object.keys(GAME_CONFIG[g].maps).join(', ')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Map Selection */}
              <div style={card}>
                <h2 className="text-white font-semibold mb-4">Select Map</h2>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(currentMaps).map(([mapName, mapData]) => (
                    <button key={mapName} type="button"
                      onClick={() => setMap(mapName)}
                      style={map === mapName ? selected : unselected}>
                      <p className="text-white font-medium">{mapName}</p>
                      <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                        {(mapData as any).maxPlayers} Players Max
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode */}
              <div style={card}>
                <h2 className="text-white font-semibold mb-4">Game Mode</h2>
                <div className="grid grid-cols-3 gap-3">
                  {MODES.map(m => (
                    <button key={m} type="button"
                      onClick={() => setMode(m)}
                      style={mode === m ? selected : unselected}>
                      <p className="text-white font-medium">{m}</p>
                      <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                        {MODE_TEAM_SIZE[m]} Player{MODE_TEAM_SIZE[m] > 1 ? 's' : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Player Limit */}
              <div style={card}>
                <h2 className="text-white font-semibold mb-4">Player Limit</h2>
                <div className="flex flex-wrap gap-2 mt-2 mb-3">
                  {[10, 15, 20, 25, 50, 100].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setMaxPlayers(n);
                        setUseCustomLimit(true);
                      }}
                      className={maxPlayers === n && useCustomLimit
                        ? 'bg-purple-600 text-white px-4 py-1 rounded-full text-sm'
                        : 'bg-gray-800 text-gray-400 px-4 py-1 rounded-full text-sm border border-gray-700'}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomLimit(false);
                      setMaxPlayers(mapMaxPlayers);
                    }}
                    className={!useCustomLimit
                      ? 'bg-purple-600 text-white px-4 py-1 rounded-full text-sm'
                      : 'bg-gray-800 text-gray-400 px-4 py-1 rounded-full text-sm border border-gray-700'}
                  >
                    Default ({mapMaxPlayers})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCustomLimit(true)}
                    className={useCustomLimit && ![10, 15, 20, 25, 50, 100].includes(maxPlayers)
                      ? 'bg-purple-600 text-white px-4 py-1 rounded-full text-sm'
                      : 'bg-gray-800 text-gray-400 px-4 py-1 rounded-full text-sm border border-gray-700'}
                  >
                    Custom Limit
                  </button>
                </div>
                
                {useCustomLimit && (
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={maxPlayers}
                    onChange={e => setMaxPlayers(Number(e.target.value))}
                    placeholder="Enter player limit (2-100)"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none"
                    style={{ background: '#1A1A28', border: '1px solid #1E2035' }}
                    onFocus={e => e.target.style.border = '1px solid #7C3AED'}
                    onBlur={e => e.target.style.border = '1px solid #1E2035'}
                  />
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Current: {actualMaxPlayers} players max
                </p>
              </div>

              {/* Entry Type */}
              <div style={card}>
                <h2 className="text-white font-semibold mb-4">Entry Type</h2>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEntryType('PAID')}
                    className={entryType === 'PAID'
                      ? 'bg-purple-600 text-white px-6 py-2 rounded-lg'
                      : 'bg-gray-800 text-gray-400 px-6 py-2 rounded-lg border border-gray-700'}
                  >
                    💰 Paid Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryType('FREE')}
                    className={entryType === 'FREE'
                      ? 'bg-green-600 text-white px-6 py-2 rounded-lg'
                      : 'bg-gray-800 text-gray-400 px-6 py-2 rounded-lg border border-gray-700'}
                  >
                    🎁 Free Entry
                  </button>
                </div>
              </div>

              {/* Entry Fee (Only if PAID) */}
              {entryType === 'PAID' && (
                <div style={card}>
                  <h2 className="text-white font-semibold mb-4">Entry Fee (₹)</h2>
                  <div className="grid grid-cols-4 gap-3">
                    {ENTRY_FEES.map(fee => (
                      <button key={fee} type="button"
                        onClick={() => setEntryFee(fee)}
                        style={entryFee === fee ? selected : unselected}
                        className="text-center">
                        <p className="text-white font-bold text-lg">₹{fee}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Prize Pool */}
              <div style={card}>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={useCustomPrize}
                    onChange={e => setUseCustomPrize(e.target.checked)}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <label className="text-white font-semibold cursor-pointer" onClick={() => setUseCustomPrize(!useCustomPrize)}>
                    Set Custom Prize Pool
                  </label>
                </div>
                
                {useCustomPrize && (
                  <div className="mt-2">
                    <input
                      type="number"
                      value={customPrize}
                      onChange={e => setCustomPrize(e.target.value)}
                      placeholder="Enter prize amount in ₹"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none"
                      style={{ background: '#1A1A28', border: '1px solid #1E2035' }}
                      onFocus={e => e.target.style.border = '1px solid #7C3AED'}
                      onBlur={e => e.target.style.border = '1px solid #1E2035'}
                    />
                    {entryType === 'FREE' && (
                      <p className="text-green-400 text-xs mt-1">
                        💡 Free entry — You fund this prize from platform
                      </p>
                    )}
                    {entryType === 'PAID' && customPrize && (
                      <p className="text-gray-400 text-xs mt-1">
                        Total collection: ₹{entryFee * actualMaxPlayers}
                        {' '}| Your prize: ₹{customPrize}
                        {' '}| Platform cut: ₹{entryFee * actualMaxPlayers - Number(customPrize)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div style={card}>
                <h2 className="text-white font-semibold mb-4">Schedule</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider block mb-2"
                      style={{ color: '#94A3B8' }}>Start Time *</label>
                    <input type="datetime-local"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1A1A28', border: '1px solid #1E2035', colorScheme: 'dark' }}
                      onFocus={e => e.target.style.border = '1px solid #7C3AED'}
                      onBlur={e => e.target.style.border = '1px solid #1E2035'}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider block mb-2"
                      style={{ color: '#94A3B8' }}>Custom Title (Optional)</label>
                    <input type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={`${game} ${map} ${mode} ₹${entryFee}`}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1A1A28', border: '1px solid #1E2035' }}
                      onFocus={e => e.target.style.border = '1px solid #7C3AED'}
                      onBlur={e => e.target.style.border = '1px solid #1E2035'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT - Prize Preview */}
            <div>
              <div className="sticky top-6" style={card}>
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  <h2 className="text-white font-semibold">Prize Preview</h2>
                </div>

                {/* Total collection */}
                <div className="p-4 rounded-xl text-center mb-4"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>Total Collection</p>
                  <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>
                    ₹{totalCollection.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#475569' }}>
                    {actualMaxPlayers} × ₹{entryType === 'FREE' ? 0 : entryFee}
                  </p>
                </div>

                {/* Breakdown */}
                {[
                  { label: 'Winner Prize', value: displayPrize, color: '#10B981', bold: true },
                  ...(teamSize > 1 ? [{
                    label: `Per Member (÷${teamSize})`,
                    value: prizePerMember,
                    color: '#10B981',
                    bold: false
                  }] : []),
                  { label: 'Manager Cut', value: prizes.managerCut, color: '#94A3B8', bold: false },
                  { label: 'Admin Cut', value: prizes.adminCut, color: '#94A3B8', bold: false },
                ].map(({ label, value, color, bold }) => (
                  <div key={label}
                    className="flex justify-between items-center py-2"
                    style={{ borderBottom: '1px solid #1E2035' }}>
                    <span className="text-sm" style={{ color: '#94A3B8' }}>{label}</span>
                    <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'}`}
                      style={{ color }}>
                      ₹{value.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}

                {/* Match info */}
                <div className="mt-4 p-3 rounded-xl" style={{ background: '#1A1A28' }}>
                  <p className="text-xs" style={{ color: '#475569' }}>
                    {game} · {map} · {mode} · {actualMaxPlayers} players · {entryType}
                  </p>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full mt-6 py-3.5 rounded-xl font-semibold text-sm text-white"
                  style={{
                    background: loading ? '#4B5563' : 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.35)',
                  }}>
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Create Match
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
