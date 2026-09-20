import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, AlertTriangle, MessageSquare, Library } from 'lucide-react'
import { format, isPast } from 'date-fns'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function UserDashboard() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/history').then(r => setHistory(r.data.history || [])).finally(() => setLoading(false))
  }, [])

  const active   = history.filter(t => t.status === 'borrowed')
  const overdue  = active.filter(t => isPast(new Date(t.due_date)))
  const returned = history.filter(t => t.status === 'returned')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Hello, {user?.name?.split(' ')[0]}</h1>
        <p className="text-ink-500 text-sm mt-1">Here's your library activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: BookOpen,      label: 'Currently Borrowed', value: active.length,   color: 'blue' },
          { icon: AlertTriangle,  label: 'Overdue',            value: overdue.length,  color: 'red' },
          { icon: Clock,          label: 'Total Returned',     value: returned.length, color: 'jade' },
          { icon: MessageSquare,  label: 'AI Chats',           value: '∞',             color: 'amber' },
        ].map(s => (
          <div key={s.label} className="stat-card animate-slide-up">
            <div className={`w-9 h-9 rounded-xl bg-${s.color === 'red' ? 'red' : s.color === 'blue' ? 'blue' : s.color === 'jade' ? 'jade' : 'amber'}-100 flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 text-${s.color === 'red' ? 'red' : s.color === 'blue' ? 'blue' : s.color === 'jade' ? 'jade' : 'amber'}-700`} />
            </div>
            <p className="text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Currently borrowed */}
      {active.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
            <h2 className="section-title">Currently Borrowed</h2>
            <Link to="/dashboard/history" className="text-sm text-amber-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-ink-50">
            {active.map(t => {
              const due     = new Date(t.due_date)
              const isOver  = isPast(due)
              return (
                <div key={t.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-12 h-16 bg-ink-100 rounded-lg overflow-hidden flex-shrink-0">
                    {t.cover_url
                      ? <img src={t.cover_url} alt={t.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-ink-300" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink-800 line-clamp-1">{t.title}</p>
                    <p className="text-sm text-ink-500">{t.author}</p>
                    <p className={`text-xs mt-1 font-medium ${isOver ? 'text-red-600' : 'text-ink-400'}`}>
                      {isOver ? <AlertTriangle className="w-3 h-3 inline mr-1" /> : ''}
                      {isOver ? 'OVERDUE – ' : 'Due: '}
                      {format(due, 'MMM d, yyyy')}
                    </p>
                  </div>
                  {isOver && <span className="badge badge-red shrink-0">Overdue</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/dashboard/books"
          className="card p-6 flex items-center gap-4 hover:border-ink-300 transition-colors group">
          <div className="w-12 h-12 bg-ink-100 group-hover:bg-ink-900 rounded-2xl flex items-center justify-center transition-colors">
            <BookOpen className="w-6 h-6 text-ink-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-semibold text-ink-800">Browse Books</p>
            <p className="text-sm text-ink-400">Explore our full catalogue</p>
          </div>
        </Link>
        <Link to="/dashboard/chatbot"
          className="card p-6 flex items-center gap-4 hover:border-amber-200 transition-colors group">
          <div className="w-12 h-12 bg-amber-100 group-hover:bg-amber-500 rounded-2xl flex items-center justify-center transition-colors">
            <MessageSquare className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-semibold text-ink-800">AI Assistant</p>
            <p className="text-sm text-ink-400">Get personalised recommendations</p>
          </div>
        </Link>
      </div>

      {/* Recent activity */}
      {history.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-ink-100">
            <h2 className="section-title">Recent Activity</h2>
          </div>
          <div className="divide-y divide-ink-50">
            {history.slice(0, 5).map(t => (
              <div key={t.id} className="px-6 py-3 flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'returned' ? 'bg-jade-400' : t.status === 'overdue' ? 'bg-red-400' : 'bg-blue-400'}`} />
                <span className="font-medium text-ink-800 flex-1 line-clamp-1">{t.title}</span>
                <span className={`badge ${t.status === 'returned' ? 'badge-green' : t.status === 'overdue' ? 'badge-red' : 'badge-blue'}`}>
                  {t.status}
                </span>
                <span className="text-ink-400 text-xs whitespace-nowrap">{format(new Date(t.borrow_date), 'MMM d')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && !loading && (
        <div className="card p-12 text-center">
          <div className="flex justify-center mb-4">
            <Library className="w-12 h-12 text-ink-200" />
          </div>
          <p className="font-display text-lg font-bold text-ink-700 mb-1">Start your reading journey</p>
          <p className="text-ink-500 text-sm mb-8">Browse our catalogue or ask our AI assistant for recommendations</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/dashboard/books" className="px-8 py-3 bg-[#0E1C2F] text-[#CC993A] rounded-xl font-bold transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" />
              Browse Books
            </Link>
            <Link to="/dashboard/chatbot" className="px-8 py-3 bg-white border-2 border-[#0E1C2F] text-[#0E1C2F] rounded-xl font-bold transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Ask AI
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}