import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  PlusCircle, 
  QrCode, 
  UserCog, 
  BarChart3 
} from 'lucide-react'
import { format } from 'date-fns'
import api from '../services/api'

const StatCard = ({ icon: Icon, label, value, sub, color = 'ink' }) => (
  <div className="stat-card animate-slide-up">
    <div className={`w-11 h-11 rounded-xl bg-${color === 'jade' ? 'jade' : color === 'blue' ? 'blue' : color === 'amber' ? 'amber' : 'red'}-100 flex items-center justify-center mb-3`}>
      <Icon className={`w-5 h-5 text-${color === 'jade' ? 'jade' : color === 'blue' ? 'blue' : color === 'amber' ? 'amber' : 'red'}-700`} />
    </div>
    <p className="text-2xl font-display font-bold text-ink-900">{value ?? '–'}</p>
    <p className="text-sm font-medium text-ink-600">{label}</p>
    {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
  </div>
)

const statusBadge = s => {
  const map = { borrowed: 'badge-blue', returned: 'badge-green', overdue: 'badge-red' }
  return <span className={map[s] || 'badge-gray'}>{s}</span>
}

export default function AdminDashboard() {
  const [data,     setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full" />
    </div>
  )

  const { stats, recentTransactions } = data || {}

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-ink-500 text-sm mt-1">Library overview and recent activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}       label="Total Books"        value={stats?.books?.total}        sub={`${stats?.books?.available} available`}   color="blue" />
        <StatCard icon={Users}          label="Active Members"     value={stats?.users?.active}       sub={`${stats?.users?.pending} pending`}        color="jade" />
        <StatCard icon={ArrowLeftRight} label="Total Borrows"      value={stats?.transactions?.total} sub={`${stats?.transactions?.borrowed} active`} color="amber" />
        <StatCard icon={AlertTriangle}  label="Overdue"            value={stats?.overdue}             sub="Need attention"                            color="red" />
      </div>

      {/* Quick actions - Replaced emojis with SVGs and Button Styling */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { to: '/admin/books',        icon: PlusCircle, label: 'Add Book', color: 'blue' },
          { to: '/admin/transactions', icon: QrCode,     label: 'Issue / Return', color: 'amber' },
          { to: '/admin/users',        icon: UserCog,    label: 'Manage Users', color: 'jade' },
          { to: '/admin/analytics',    icon: BarChart3,  label: 'Analytics', color: 'ink' },
        ].map(a => (
          <Link key={a.to} to={a.to}
            className="card p-5 flex flex-col items-center gap-3 text-center border-2 border-transparent hover:border-ink-200 hover:shadow-md active:scale-95 transition-all group bg-white">
            <div className={`w-12 h-12 rounded-2xl bg-ink-50 group-hover:bg-ink-900 flex items-center justify-center transition-colors`}>
                <a.icon className="w-6 h-6 text-ink-600 group-hover:text-white transition-colors" />
            </div>
            <span className="text-sm font-bold text-ink-800 tracking-tight">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="section-title flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Activity
          </h2>
          <Link to="/admin/transactions" className="text-sm text-amber-600 font-bold hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50">
              <tr>
                {['Book', 'Member', 'Date', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {recentTransactions?.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-400">No transactions yet</td></tr>
              )}
              {recentTransactions?.map(t => (
                <tr key={t.id} className="hover:bg-ink-50/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-ink-800">{t.book_title}</td>
                  <td className="px-6 py-3 text-ink-600">{t.user_name}</td>
                  <td className="px-6 py-3 text-ink-400">{format(new Date(t.borrow_date), 'MMM d, yyyy')}</td>
                  <td className="px-6 py-3">{statusBadge(t.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}