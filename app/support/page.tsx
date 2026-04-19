'use client'
import { useState, useEffect, useRef } from 'react'

export default function SupportPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser._id || selectedUser.userId)
    }
  }, [selectedUser])

  async function loadConversations() {
    const res = await fetch('/api/proxy/chat/support/all')
    const data = await res.json()
    setConversations(data.conversations || [])
    setLoading(false)
  }

  async function loadMessages(userId: string) {
    const res = await fetch(`/api/proxy/chat/support/${userId}`)
    const data = await res.json()
    setMessages(data.messages || [])
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView()
    }, 100)
  }

  async function sendReply() {
    if (!replyText.trim() || !selectedUser) return
    
    await fetch(
      `/api/proxy/chat/support/${selectedUser._id || selectedUser.userId}/reply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: replyText }),
      }
    )
    
    setReplyText('')
    loadMessages(selectedUser._id || selectedUser.userId)
  }

  return (
    <div className="flex h-screen bg-gray-950">
      
      {/* Left: Conversation list */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg">
            💬 Support Inbox
          </h2>
          <p className="text-gray-500 text-sm">
            {conversations.length} conversations
          </p>
        </div>
        
        {loading ? (
          <div className="p-4 text-gray-500">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No support messages yet
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.userId || conv._id}
              onClick={() => setSelectedUser(conv)}
              className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 ${
                (selectedUser?._id === conv.userId || selectedUser?.userId === conv.userId) 
                  ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center text-white font-bold">
                  {conv.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {conv.username || 'User'}
                  </p>
                  <p className="text-gray-500 text-xs truncate">
                    {conv.lastMessage || '...'}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-0.5">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Right: Chat window */}
      <div className="flex-1 flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to reply
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center text-white font-bold">
                {selectedUser.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-white font-bold">
                  {selectedUser.username || 'User'}
                </p>
                <p className="text-gray-500 text-xs">
                  Support conversation
                </p>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div
                  key={msg._id}
                  className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                    msg.isAdmin
                      ? 'bg-purple-700 text-white rounded-br-sm'
                      : 'bg-gray-800 text-white rounded-bl-sm'
                  }`}>
                    <p>{msg.message}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Reply input */}
            <div className="p-4 bg-gray-900 border-t border-gray-800 flex gap-3">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendReply()
                  }
                }}
                placeholder="Type reply..."
                className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2 outline-none border border-gray-700 focus:border-purple-600"
              />
              <button
                onClick={sendReply}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl font-medium"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
