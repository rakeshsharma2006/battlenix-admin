'use client'
import { useState, useEffect } from 'react'

// Types
type Ticket = {
  _id: string
  ticketNumber: string
  userId: {
    _id: string
    username: string
    email: string
    trustScore: number
  }
  category: string
  subject: string
  description: string
  screenshots: Array<{
    url: string
    uploadedAt: string
  }>
  status: 'OPEN' | 'IN_PROGRESS' | 
          'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 
            'HIGH' | 'URGENT'
  replies: Array<{
    adminUsername: string
    message: string
    isAdminReply: boolean
    createdAt: string
  }>
  relatedMatchId?: {
    title: string
    status: string
  }
  createdAt: string
}

export default function HelpCenterPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const [replyText, setReplyText] = useState('')
  const [replyStatus, setReplyStatus] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState({
    status: '',
    priority: '',
    category: '',
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    loadTickets()
    loadStats()
  }, [filter])

  async function loadTickets() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter.status) params.set('status', filter.status)
    if (filter.priority) params.set('priority', filter.priority)
    if (filter.category) params.set('category', filter.category)
    
    const res = await fetch(`/api/proxy/support/admin/all?${params}`)
    const data = await res.json()
    setTickets(data.tickets || [])
    setLoading(false)
  }

  async function loadStats() {
    const res = await fetch('/api/proxy/support/admin/stats')
    const data = await res.json()
    setStats(data)
  }

  async function sendReply() {
    if (!replyText.trim() || !selectedTicket) return
    setSending(true)
    
    const res = await fetch(
      `/api/proxy/support/admin/${selectedTicket._id}/reply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: replyText,
          status: replyStatus || undefined,
        }),
      }
    )
    
    if (res.ok) {
      setReplyText('')
      setReplyStatus('')
      // Reload ticket
      const updated = tickets.map(t =>
        t._id === selectedTicket._id
          ? { 
              ...t, 
              status: replyStatus || t.status,
              replies: [
                ...t.replies, 
                {
                  adminUsername: 'Admin',
                  message: replyText,
                  isAdminReply: true,
                  createdAt: new Date().toISOString(),
                }
              ] 
            }
          : t
      )
      setTickets(updated as any)
      setSelectedTicket(updated.find(t => t._id === selectedTicket._id) as any || null)
    }
    setSending(false)
  }

  async function updateStatus(ticketId: string, status: string) {
    await fetch(`/api/proxy/support/admin/${ticketId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status }),
    })
    loadTickets()
    if (selectedTicket?._id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: status as any } : null)
    }
  }

  const priorityColor = {
    URGENT: 'bg-red-900 text-red-300 border border-red-700',
    HIGH: 'bg-orange-900 text-orange-300 border border-orange-700',
    MEDIUM: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
    LOW: 'bg-gray-800 text-gray-400 border border-gray-700',
  }

  const statusColor = {
    OPEN: 'bg-blue-900 text-blue-300',
    IN_PROGRESS: 'bg-yellow-900 text-yellow-300',
    RESOLVED: 'bg-green-900 text-green-300',
    CLOSED: 'bg-gray-800 text-gray-500',
  }

  const categoryLabel: Record<string, string> = {
    PAYMENT_FAILED: '💳 Payment Failed',
    PAYMENT_DEDUCTED: '💸 Amount Deducted',
    APP_CRASH: '📱 App Crash',
    ROOM_NOT_RECEIVED: '🚪 No Room Details',
    PRIZE_NOT_RECEIVED: '🏆 Prize Not Received',
    ACCOUNT_ISSUE: '👤 Account Issue',
    MATCH_ISSUE: '⚔️ Match Issue',
    REFUND_REQUEST: '↩️ Refund Request',
    OTHER: '❓ Other',
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      
      {/* Image lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Screenshot"
            className="max-w-3xl max-h-screen object-contain rounded-lg"
          />
          <button
            className="absolute top-4 right-4 text-white bg-gray-800 rounded-full p-2"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* LEFT: Ticket List */}
      <div className="w-96 border-r border-gray-800 flex flex-col bg-gray-900">
        
        {/* Header + Stats */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-white font-bold text-xl mb-3">🎧 Help Center</h1>
          
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-blue-950 rounded-lg p-2 text-center">
              <p className="text-blue-300 font-bold text-lg">{stats.openCount || 0}</p>
              <p className="text-blue-400 text-xs">Open</p>
            </div>
            <div className="bg-red-950 rounded-lg p-2 text-center">
              <p className="text-red-300 font-bold text-lg">{stats.urgentCount || 0}</p>
              <p className="text-red-400 text-xs">Urgent</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 text-center">
              <p className="text-white font-bold text-lg">{tickets.length}</p>
              <p className="text-gray-400 text-xs">Total</p>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <select
              value={filter.status}
              onChange={e => setFilter(f => ({...f, status: e.target.value}))}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700"
            >
              <option value="">All Status</option>
              <option value="OPEN">🔵 Open</option>
              <option value="IN_PROGRESS">🟡 In Progress</option>
              <option value="RESOLVED">🟢 Resolved</option>
              <option value="CLOSED">⚫ Closed</option>
            </select>
            
            <select
              value={filter.priority}
              onChange={e => setFilter(f => ({...f, priority: e.target.value}))}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700"
            >
              <option value="">All Priority</option>
              <option value="URGENT">🔴 Urgent</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">⚪ Low</option>
            </select>
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-4xl mb-3">🎉</p>
              <p>No tickets found</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors
                           ${selectedTicket?._id === ticket._id ? 'bg-gray-800 border-l-2 border-l-purple-500' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium text-sm">{ticket.ticketNumber}</p>
                    <p className="text-gray-400 text-xs">@{ticket.userId?.username}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </div>
                
                <p className="text-white text-sm font-medium truncate mb-1">{ticket.subject}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-400">{categoryLabel[ticket.category]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[ticket.status]}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                
                {ticket.screenshots?.length > 0 && (
                  <p className="text-gray-500 text-xs mt-1">📷 {ticket.screenshots.length} screenshot(s)</p>
                )}
                
                <p className="text-gray-600 text-xs mt-1">
                  {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Ticket Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedTicket ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-6xl mb-4">🎧</p>
              <p className="text-lg">Select a ticket to view details</p>
            </div>
          </div>
        ) : (
          <>
            {/* Ticket header */}
            <div className="p-6 border-b border-gray-800 bg-gray-900">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-white font-bold text-xl">{selectedTicket.ticketNumber}</h2>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${priorityColor[selectedTicket.priority]}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full ${statusColor[selectedTicket.status]}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-white font-medium text-lg">{selectedTicket.subject}</p>
                  <p className="text-purple-400 text-sm mt-1">{categoryLabel[selectedTicket.category]}</p>
                </div>
                
                {/* Quick status change */}
                <select
                  value={selectedTicket.status}
                  onChange={e => updateStatus(selectedTicket._id, e.target.value)}
                  className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {/* User info */}
              <div className="flex items-center gap-4 mt-4 p-3 bg-gray-800 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center text-white font-bold">
                  {selectedTicket.userId?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">@{selectedTicket.userId?.username}</p>
                  <p className="text-gray-400 text-sm">{selectedTicket.userId?.email}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-gray-400 text-xs">Trust Score</p>
                  <p className={`font-bold text-sm ${(selectedTicket.userId?.trustScore || 0) >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedTicket.userId?.trustScore}/100
                  </p>
                </div>
              </div>

              {/* Related match */}
              {selectedTicket.relatedMatchId && (
                <div className="mt-2 p-2 bg-gray-800 rounded-lg flex items-center gap-2">
                  <span className="text-gray-400 text-xs">Related Match:</span>
                  <span className="text-white text-xs font-medium">{selectedTicket.relatedMatchId.title}</span>
                  <span className="text-gray-500 text-xs">({selectedTicket.relatedMatchId.status})</span>
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Description */}
              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-gray-400 text-xs font-medium uppercase mb-2">User Description</p>
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Screenshots */}
              {selectedTicket.screenshots?.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4">
                  <p className="text-gray-400 text-xs font-medium uppercase mb-3">
                    📷 Screenshots ({selectedTicket.screenshots.length})
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedTicket.screenshots.map((ss, i) => (
                      <div
                        key={i}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedImage(ss.url)}
                      >
                        <img
                          src={ss.url}
                          alt={`Screenshot ${i + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-700 group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded-lg transition-opacity">
                          <span className="text-white text-xs">🔍 View Full</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation / Replies */}
              {selectedTicket.replies?.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4">
                  <p className="text-gray-400 text-xs font-medium uppercase mb-3">Conversation</p>
                  <div className="space-y-3">
                    {selectedTicket.replies.map((reply, i) => (
                      <div key={i} className={`flex ${reply.isAdminReply ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-sm px-4 py-3 rounded-2xl text-sm ${reply.isAdminReply ? 'bg-purple-900 text-white rounded-br-sm' : 'bg-gray-800 text-white rounded-bl-sm'}`}>
                          <p className="text-xs opacity-60 mb-1">
                            {reply.isAdminReply ? `Admin (${reply.adminUsername})` : 'User'}
                          </p>
                          <p className="leading-relaxed">{reply.message}</p>
                          <p className="text-xs opacity-50 mt-1">
                            {new Date(reply.createdAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reply input */}
            <div className="p-4 border-t border-gray-800 bg-gray-900">
              <div className="flex gap-3 mb-3">
                <select
                  value={replyStatus}
                  onChange={e => setReplyStatus(e.target.value)}
                  className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700"
                >
                  <option value="">Keep current status</option>
                  <option value="IN_PROGRESS">Mark In Progress</option>
                  <option value="RESOLVED">Mark Resolved ✓</option>
                  <option value="CLOSED">Close Ticket</option>
                </select>
              </div>
              <div className="flex gap-3">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-purple-600 resize-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 rounded-xl font-medium text-sm transition-colors"
                >
                  {sending ? '...' : 'Send ↑'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
