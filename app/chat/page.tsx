'use client';
import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import { ADMIN_COLORS } from '@/lib/admin-utils';
import SupportPage from '../support/page'; // Reuse Support Page logic

export default function ChatManagementPage() {
  const [activeTab, setActiveTab] = useState<'ROOMS' | 'SUPPORT' | 'DIRECT'>('ROOMS');

  return (
    <AdminShell>
      <div className="flex flex-col h-[calc(100vh-100px)]">
        <h1 className="text-2xl font-bold text-white mb-4">Chat Management</h1>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab('ROOMS')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'ROOMS' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500'
            }`}
          >
            Room Chats
          </button>
          <button
            onClick={() => setActiveTab('SUPPORT')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'SUPPORT' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500'
            }`}
          >
            Support Inbox
          </button>
          <button
            onClick={() => setActiveTab('DIRECT')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'DIRECT' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500'
            }`}
          >
            Direct Messages
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-[#13131E] rounded-xl overflow-hidden border border-[#1E2035]">
          {activeTab === 'ROOMS' && <RoomChatsTab />}
          {activeTab === 'SUPPORT' && (
            <div className="h-full bg-gray-950">
               {/* Embed Support Page logic or iframe component */}
               <SupportPage />
            </div>
          )}
          {activeTab === 'DIRECT' && <DirectMessagesTab />}
        </div>
      </div>
    </AdminShell>
  );
}

// Basic Room Chats Tab logic
function RoomChatsTab() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/matches?status=LIVE,READY')
      .then(res => res.json())
      .then(data => {
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleChat = async (matchId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/proxy/matches/${matchId}/chat-toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus })
      });
      setMatches(prev => prev.map(m => m._id === matchId ? { ...m, chatEnabled: !currentStatus } : m));
    } catch {}
  };

  return (
    <div className="p-6">
      <h2 className="text-white font-semibold mb-4">Active Room Chats</h2>
      {loading ? (
        <p className="text-gray-500">Loading matches...</p>
      ) : matches.length === 0 ? (
        <p className="text-gray-500">No active matches found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map(match => (
            <div key={match._id} className="bg-[#1A1A28] border border-[#2A2A38] rounded-xl p-4">
              <h3 className="text-white font-medium mb-1">{match.title}</h3>
              <p className="text-gray-400 text-xs mb-4">{match.playersCount} Players | Game: {match.game}</p>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleChat(match._id, match.chatEnabled ?? true)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold ${
                    (match.chatEnabled ?? true) ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {(match.chatEnabled ?? true) ? '💬 Chat ON' : '🔇 Chat OFF'}
                </button>
                <button
                  className="px-3 py-1.5 bg-purple-900 text-purple-300 rounded text-xs font-semibold"
                  onClick={() => window.location.href = `/chat/${match._id}`}
                >
                  View Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Basic Direct Messages Tab logic
function DirectMessagesTab() {
  return (
    <div className="p-6 h-full flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-blue-900/20 text-blue-400 rounded-full flex items-center justify-center mb-4 text-2xl">
        🔒
      </div>
      <h2 className="text-white font-bold text-xl mb-2">Direct Messages Overview</h2>
      <p className="text-gray-400 max-w-sm mb-6">
        Direct user-to-user messages are private. You can only view high-level statistics here.
      </p>
      <div className="bg-[#1A1A28] rounded-xl border border-[#2A2A38] p-6 flex gap-12 text-left">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Conversations</p>
          <p className="text-indigo-400 font-bold text-2xl">Loading...</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Messages Today</p>
          <p className="text-indigo-400 font-bold text-2xl">Loading...</p>
        </div>
      </div>
    </div>
  );
}
