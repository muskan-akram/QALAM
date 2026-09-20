import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  PenNib,
  SendIcon,
  SpinnerIcon,
  PlusIcon,
  CloseIcon,
  MenuIcon,
  BookStack
} from '../components/shared/Icons'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  'Books on machine learning',
  'Classic science fiction novels',
  'Self-help for productivity',
  'Best programming books',
  'History of civilizations',
  'Philosophy for beginners',
  'Modern literary fiction',
  'Data science and statistics',
  'Mujhe travel books chahiye',
  'Is Atomic Habits a good book?',
]

// ── Storage helpers ───────────────────────────────────────────────────────────
const STORAGE_KEY = (userId) => `qalam_sessions_${userId}`

function loadSessions(userId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSessions(userId, sessions) {
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(sessions))
  } catch { /* quota exceeded */ }
}

function autoLabel(message) {
  if (!message) return 'New Chat'
  const words = message.trim().split(/\s+/)
  let label = ''
  for (const w of words) {
    if (label.length + w.length + 1 > 38) break
    label = label ? label + ' ' + w : w
  }
  return label.charAt(0).toUpperCase() + label.slice(1) || 'New Chat'
}

function makeWelcome(name) {
  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hello **${name || 'there'}**! I'm **QALAM**, your personal library guide. 📚\n\nAsk me in **English**, **Roman Urdu**, or **اردو** — I understand all three!\n\nTell me a topic, genre, author, or mood and I'll find the perfect books with honest reviews. What shall we discover today?`,
    recommendations: [],
    timestamp: new Date().toISOString(),
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1 px-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="inline-block w-2 h-2 rounded-full"
          style={{
            background: 'var(--c-ink-muted)',
            animationDelay: `${i * 0.18}s`,
            animation: 'pulse 1.2s ease-in-out infinite'
          }} />
      ))}
    </div>
  )
}

function BookCard({ book }) {
  return (
    <Link to={`/dashboard/books/${book.id}`}
      className="card card-hover flex gap-3 p-3 group"
      style={{ minWidth: 0 }}>
      <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,var(--c-cream-dark),#e8dcc8)' }}>
        {book.cover_url
          ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
            <BookStack size={16} color="var(--c-ink-muted)" />
          </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs leading-snug line-clamp-2 group-hover:text-navy-mid transition-colors"
          style={{ color: 'var(--c-ink)', fontFamily: 'Playfair Display,serif' }}>
          {book.title}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--c-ink-soft)' }}>{book.author}</p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {book.genre && (
            <span className="badge badge-navy" style={{ fontSize: 9 }}>{book.genre}</span>
          )}
          <span className={`badge ${book.available_copies > 0 ? 'badge-green' : 'badge-red'}`}
            style={{ fontSize: 9 }}>
            {book.available_copies > 0 ? 'Available' : 'Borrowed'}
          </span>
          {book.similarity_score && (
            <span className="badge badge-gold" style={{ fontSize: 9 }}>
              {Math.round(book.similarity_score * 100)}% match
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function SessionItem({ session, isActive, onClick, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(session.label)
  const inputRef = useRef(null)

  const startEdit = (e) => {
    e.stopPropagation()
    setDraft(session.label)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const commitEdit = () => {
    setEditing(false)
    if (draft.trim() && draft !== session.label) onRename(session.id, draft.trim())
  }

  return (
    <div
      onClick={onClick}
      className={`group relative w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isActive
        ? 'bg-[#e8dcc8] text-[#1a2b40] font-semibold shadow-sm'
        : 'hover:bg-[#f0e9da] text-[#7a6d55]'
        }`}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="w-full bg-white border border-[#d4c3a3] rounded px-2 py-0.5 text-xs text-[#1a2b40] outline-none"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false) }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <>
          <p className="text-xs truncate pr-10 leading-snug">{session.label}</p>
          {session.preview && (
            <p className="text-[10px] truncate mt-0.5 opacity-60">{session.preview}</p>
          )}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1">
            <button
              onClick={startEdit}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#d4c3a3] text-[#7a6d55]"
              title="Rename">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(session.id) }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 text-red-400"
              title="Delete">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChatbotPage() {
  const { user } = useAuth()
  const userId = user?.id || user?.email || 'guest'

  const [sessions, setSessions] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  const activeSession = sessions.find(s => s.id === activeId)
  const messages = activeSession?.messages || []

  // ── Initialize ──────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = loadSessions(userId)
    if (stored && stored.length > 0) {
      setSessions(stored)
      setActiveId(stored[0].id)
    } else {
      const firstId = `sess_${Date.now()}`
      const firstSess = {
        id: firstId,
        label: 'New Chat',
        messages: [makeWelcome(user?.name?.split(' ')[0])],
        preview: '',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
      setSessions([firstSess])
      setActiveId(firstId)
    }
    setInitialized(true)
  }, [userId])

  // ── Persist ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialized && sessions.length > 0) {
      saveSessions(userId, sessions)
    }
  }, [sessions, initialized, userId])

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Session helpers ───────────────────────────────────────────────────────
  const updateSession = (id, updater) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updater(s) } : s))
  }

  const addMessage = (sessionId, msg) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s
      const msgs = [...s.messages, msg]
      const preview = msg.role === 'assistant'
        ? msg.content.replace(/\*\*/g, '').replace(/\*/g, '').slice(0, 60)
        : s.preview
      return { ...s, messages: msgs, preview, updatedAt: new Date().toISOString() }
    }))
  }

  const newChat = () => {
    const id = `sess_${Date.now()}`
    const sess = {
      id,
      label: 'New Chat',
      messages: [{
        id: 'welcome-new',
        role: 'assistant',
        content: 'New conversation started! What books can I help you discover?\n\nAsk me in English, Roman Urdu, or اردو — I understand all three! 😊',
        recommendations: [],
        timestamp: new Date().toISOString(),
      }],
      preview: '',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    setSessions(prev => [sess, ...prev])
    setActiveId(id)
    setShowHistory(false)
  }

  const renameSession = (id, label) => {
    updateSession(id, s => ({ ...s, label }))
  }

  const deleteSession = (id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (next.length === 0) {
        const newId = `sess_${Date.now()}`
        const newSess = {
          id: newId, label: 'New Chat',
          messages: [makeWelcome(user?.name?.split(' ')[0])],
          preview: '', updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
        }
        setActiveId(newId)
        return [newSess]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: msg,
      recommendations: [],
      timestamp: new Date().toISOString(),
    }

    const currentSess = sessions.find(s => s.id === activeId)
    const userMsgCount = (currentSess?.messages || []).filter(m => m.role === 'user').length
    if (userMsgCount === 0) {
      updateSession(activeId, s => ({ ...s, label: autoLabel(msg) }))
    }

    addMessage(activeId, userMsg)
    setLoading(true)

    try {
      // Send last 12 messages for better context
      const history = messages.slice(-12).map(m => ({ role: m.role, content: m.content }))
      const { data } = await api.post('/chatbot/message', {
        message: msg,
        history,
        session_id: activeId,
        user_id: userId,
      })

      const botMsg = {
        id: `b_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        recommendations: data.recommendations || [],
        timestamp: new Date().toISOString(),
      }
      addMessage(activeId, botMsg)
    } catch {
      toast.error('AI service is currently unreachable.')
      addMessage(activeId, {
        id: `b_err_${Date.now()}`,
        role: 'assistant',
        content: "Mafi chahta hoon — AI service se connection nahi ho raha. Thodi der mein dobara try karein! 🙏",
        recommendations: [],
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, activeId, sessions, userId])

  const handleInputChange = (e) => {
    setInput(e.target.value)
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px' }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const renderContent = (text) => {
    return (text || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '•')
      .replace(/\n/g, '<br/>')
  }

  if (!initialized) return (
    <div className="flex items-center justify-center h-full">
      <SpinnerIcon size={32} color="var(--c-gold)" />
    </div>
  )

  const sortedSessions = [...sessions].sort((a, b) =>
    new Date(b.updatedAt) - new Date(a.updatedAt)
  )

  return (
    <div className="flex h-full gap-5" style={{ height: 'calc(100vh - 100px)' }}>

      {/* ── History Sidebar ─────────────────────────────────────────────── */}
      <div className={`${showHistory ? 'w-72 opacity-100' : 'w-0 opacity-0 pointer-events-none'} flex-shrink-0 transition-all duration-300 overflow-hidden`}>
        <div className="w-72 h-full flex flex-col card overflow-hidden"
          style={{ background: '#f7f2e9', borderRight: '1px solid var(--c-border)' }}>

          <div className="flex items-center justify-between px-4 py-4"
            style={{ borderBottom: '1px solid var(--c-border)' }}>
            <p className="font-bold text-sm" style={{ color: '#1a2b40', fontFamily: 'Playfair Display,serif' }}>
              Chat History
            </p>
            <button onClick={() => setShowHistory(false)}
              className="p-1 rounded-lg hover:bg-[#e8dcc8] transition-colors">
              <CloseIcon size={16} color="var(--c-ink-soft)" />
            </button>
          </div>

          <div className="px-3 pt-3 pb-2">
            <button onClick={newChat}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#d4c3a3] bg-white hover:bg-[#eee4d1] transition-all text-xs font-bold text-[#1a2b40] shadow-sm">
              <PlusIcon size={14} /> New Conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {sortedSessions.length === 0 && (
              <p className="text-xs text-center text-[#b0a08a] mt-6">No conversations yet</p>
            )}
            {sortedSessions.map(s => (
              <SessionItem
                key={s.id}
                session={s}
                isActive={s.id === activeId}
                onClick={() => { setActiveId(s.id); setShowHistory(false) }}
                onRename={renameSession}
                onDelete={deleteSession}
              />
            ))}
          </div>

          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--c-border)' }}>
            <p className="text-[10px] text-center" style={{ color: 'var(--c-ink-muted)' }}>
              Chats saved locally on this device
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Chat ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 card overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--c-border)' }}>
          <button onClick={() => setShowHistory(p => !p)}
            className="p-2 rounded-lg transition-all hover:bg-[#f0e9da] text-[#1a2b40]">
            <MenuIcon size={22} />
          </button>

          <PenNib size={32} color="#C8993A" />

          <div className="flex-1">
            <h1 className="font-bold text-lg text-[#1a2b40] leading-none"
              style={{ fontFamily: 'Playfair Display,serif' }}>QALAM AI</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" style={{ animation: 'pulse 2s infinite' }} />
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Online</p>
            </div>
          </div>

          {activeSession && (
            <p className="text-xs font-medium px-3 py-1 rounded-full max-w-[180px] truncate"
              style={{ background: 'var(--c-surface2)', color: 'var(--c-ink-soft)', border: '1px solid var(--c-border)' }}>
              {activeSession.label}
            </p>
          )}

          <button onClick={newChat} className="btn-ghost text-xs px-3 py-1.5 gap-1.5">
            <PlusIcon size={13} color="currentColor" /> New
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <PenNib size={64} color="#1a2b40" />
              <h2 className="text-xl font-bold mt-4" style={{ fontFamily: 'Playfair Display,serif' }}>
                How can QALAM help you today?
              </h2>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-3`}
              style={{ animation: 'fadeInUp 0.25s ease forwards' }}>

              {msg.role === 'user'
                ? <div className="bubble-user">{msg.content}</div>
                : (
                  <div className="flex items-end gap-3 max-w-[88%]">
                    <div className="flex-shrink-0 mb-1">
                      <PenNib size={28} color="#C8993A" />
                    </div>
                    <div className="bubble-bot"
                      dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                  </div>
                )
              }

              {/* Book recommendations */}
              {msg.recommendations?.length > 0 && (
                <div className={`w-full ${msg.role === 'assistant' ? 'pl-11' : ''}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: 'var(--c-ink-muted)' }}>
                    📚 Library Books ({msg.recommendations.length} found)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.recommendations.slice(0, 4).map(b => (
                      <BookCard key={b.id} book={b} />
                    ))}
                  </div>
                  {msg.recommendations.length > 4 && (
                    <p className="text-xs mt-2" style={{ color: 'var(--c-ink-muted)' }}>
                      +{msg.recommendations.length - 4} more in library. Ask me for more details!
                    </p>
                  )}
                </div>
              )}

              <p className="text-[9px]" style={{ color: 'var(--c-ink-muted)', opacity: 0.6 }}>
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-3">
              <div className="flex-shrink-0 mb-1">
                <PenNib size={28} color="#C8993A" />
              </div>
              <div className="bubble-bot"><TypingDots /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips */}
        {messages.filter(m => m.role === 'user').length === 0 && (
          <div className="px-5 pb-3">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--c-ink-muted)' }}>
              Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.slice(0, 8).map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: 'var(--c-surface2)',
                    border: '1px solid var(--c-border)',
                    color: 'var(--c-ink-soft)'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = 'var(--c-navy)'
                    e.currentTarget.style.color = 'var(--c-navy)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = 'var(--c-border)'
                    e.currentTarget.style.color = 'var(--c-ink-soft)'
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="px-5 pb-5 pt-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--c-border)' }}>
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                rows={1}
                className="input resize-none overflow-hidden w-full"
                style={{ minHeight: '46px', maxHeight: '140px', lineHeight: 1.55, paddingRight: 16 }}
                placeholder="Ask in English, Roman Urdu, or اردو… (Shift+Enter for new line)"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKey}
                disabled={loading}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn-navy flex-shrink-0"
              style={{ padding: '11px 18px' }}>
              {loading
                ? <SpinnerIcon size={16} color="var(--c-gold-lt)" />
                : <SendIcon size={16} color="var(--c-gold-lt)" />
              }
            </button>
          </div>
          <p className="text-[10px] text-center mt-2" style={{ color: 'var(--c-ink-muted)' }}>
            QALAM AI · English · Roman Urdu · اردو · Powered by semantic search & AI
          </p>
        </div>
      </div>
    </div>
  )
}