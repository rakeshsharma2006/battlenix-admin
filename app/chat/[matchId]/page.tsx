// app/chat/[matchId]/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';

import AdminShell from '@/components/AdminShell';
import { ADMIN_COLORS } from '@/lib/admin-utils';

interface Message {
  sender: 'USER' | 'ADMIN';
  senderId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatThread {
  userId: { _id: string; username: string; email?: string };
  messages: Message[];
  lastMessageAt: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      const response = await fetch(`/api/proxy/chat/${matchId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setThreads(data.chats ?? []);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  const loadMessages = async (thread: ChatThread) => {
    setSelectedThread(thread);

    try {
      const response = await fetch(`/api/proxy/chat/${matchId}/user/${thread.userId._id}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setMessages(data.chat?.messages ?? thread.messages ?? []);
    } catch {
      setMessages(thread.messages ?? []);
    }

    window.setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) {
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/proxy/chat/send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          text: newMessage.trim(),
          targetUserId: selectedThread.userId._id,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages(selectedThread);
      }
    } catch {
      // Keep the chat input stable on failure.
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <AdminShell>
      <div
        className="chat-shell"
        style={{
          minHeight: 'calc(100vh - 112px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: `1px solid ${ADMIN_COLORS.border}`,
          borderRadius: 16,
          background: ADMIN_COLORS.bgPrimary,
        }}
      >
        <div
          className="flex items-center gap-4 p-4"
          style={{
            borderBottom: `1px solid ${ADMIN_COLORS.border}`,
            background: '#0F0F17',
          }}
        >
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
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ADMIN_COLORS.textPrimary }}>
              Match Chat
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: ADMIN_COLORS.textSecondary }}>
              {threads.length} player{threads.length !== 1 ? 's' : ''} in this match
            </p>
          </div>
        </div>

        <div className="chat-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div
            className="chat-sidebar"
            style={{
              width: 288,
              flexShrink: 0,
              overflowY: 'auto',
              borderRight: `1px solid ${ADMIN_COLORS.border}`,
              background: '#0F0F17',
            }}
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <div
                  className="animate-spin"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: `2px solid ${ADMIN_COLORS.purple500}`,
                    borderTopColor: 'transparent',
                  }}
                />
              </div>
            ) : threads.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <MessageCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.2, color: ADMIN_COLORS.textSecondary }} />
                <p style={{ margin: 0, fontSize: 14, color: ADMIN_COLORS.textMuted }}>No chat threads yet</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: ADMIN_COLORS.textMuted }}>
                  Players can message after match completes
                </p>
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.userId._id}
                  type="button"
                  onClick={() => void loadMessages(thread)}
                  style={{
                    width: '100%',
                    padding: 16,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: selectedThread?.userId._id === thread.userId._id ? ADMIN_COLORS.bgElevated : 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${ADMIN_COLORS.border}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                        color: '#FFFFFF',
                        flexShrink: 0,
                        background: ADMIN_COLORS.purple600,
                      }}
                    >
                      {thread.userId.username[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: ADMIN_COLORS.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {thread.userId.username}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: ADMIN_COLORS.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {thread.messages?.length ?? 0} messages
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center">
                <div style={{ textAlign: 'center' }}>
                  <MessageCircle size={48} style={{ margin: '0 auto 12px', opacity: 0.2, color: ADMIN_COLORS.textSecondary }} />
                  <p style={{ margin: 0, color: ADMIN_COLORS.textMuted }}>Select a player to chat</p>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="p-4 flex items-center gap-3"
                  style={{
                    borderBottom: `1px solid ${ADMIN_COLORS.border}`,
                    background: '#0F0F17',
                  }}
                >
                  <div
                    className="flex"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#FFFFFF',
                      background: ADMIN_COLORS.purple600,
                    }}
                  >
                    {selectedThread.userId.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, color: ADMIN_COLORS.textPrimary, fontWeight: 500 }}>
                      {selectedThread.userId.username}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: ADMIN_COLORS.textMuted }}>Player</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <p style={{ margin: 0, color: ADMIN_COLORS.textMuted }}>
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isAdmin = message.sender === 'ADMIN';

                      return (
                        <div key={`${message.createdAt}-${index}`} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div
                            style={{
                              maxWidth: 420,
                              padding: '10px 16px',
                              color: '#FFFFFF',
                              background: isAdmin ? 'linear-gradient(135deg, #7C3AED, #8B5CF6)' : ADMIN_COLORS.bgElevated,
                              borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            }}
                          >
                            <p style={{ margin: 0, fontSize: 14 }}>{message.text}</p>
                            <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.6 }}>
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div
                  className="p-4"
                  style={{
                    borderTop: `1px solid ${ADMIN_COLORS.border}`,
                    background: '#0F0F17',
                  }}
                >
                  <div className="flex gap-3">
                    <input
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          void sendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: 12,
                        fontSize: 14,
                        color: ADMIN_COLORS.textPrimary,
                        background: ADMIN_COLORS.bgCard,
                        border: `1px solid ${ADMIN_COLORS.border}`,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={sending || !newMessage.trim()}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                        background: newMessage.trim()
                          ? 'linear-gradient(135deg, #7C3AED, #8B5CF6)'
                          : ADMIN_COLORS.bgCard,
                        border: newMessage.trim() ? 'none' : `1px solid ${ADMIN_COLORS.border}`,
                      }}
                    >
                      <Send size={20} color="#FFFFFF" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .chat-layout {
            flex-direction: column;
          }

          .chat-sidebar {
            width: 100% !important;
            max-height: 240px;
          }
        }
      `}</style>
    </AdminShell>
  );
}
