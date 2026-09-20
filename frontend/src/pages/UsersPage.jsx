import { useEffect, useState } from 'react'
import { Loader2, UserCheck, UserX, Search } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const statusBadge = s => {
  const map = { active: 'badge-green', pending: 'badge-amber', suspended: 'badge-red' }
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>
}

export default function UsersPage() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [status,   setStatus]  = useState('')
  const [search,   setSearch]  = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  // Modified fetchUsers to accept an optional transient search override string
  const fetchUsers = (currentSearch = search) => {
    setLoading(true)
    const params = {}
    if (status) params.status = status
    if (currentSearch.trim()) params.search = currentSearch.trim()
    
    api.get('/admin/users', { params })
       .then(r => setUsers(r.data.users || []))
       .catch(() => toast.error("Failed to load members"))
       .finally(() => setLoading(false))
  }

  useEffect(() => { 
    fetchUsers() 
  }, [status])

  // Handles text clearing so the full list returns immediately
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearch(val)
    if (val === '') {
      fetchUsers('')
    }
  }

  // Ensures pressing 'Enter' submits the exact text value typed so far
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchUsers(search)
    }
  }

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id)
    try {
      await api.patch(`/admin/users/${id}/status`, { status: newStatus })
      toast.success(`User ${newStatus}`)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update')
    } finally { setUpdatingId(null) }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Members</h1>
          <p className="text-ink-400 text-sm mt-1">Manage library members</p>
        </div>

        {/* Syncing Layout and Hovering Filters Effect from transactions.js */}
        <div className="flex flex-wrap gap-3 items-center self-start">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input 
              className="input pl-9" 
              placeholder="Search by name or email…"
              value={search} 
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown} 
            />
          </div>
          
          <div className="flex gap-1 bg-ink-50 p-1 rounded-xl border border-ink-100">
            {['', 'pending', 'active', 'suspended'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all
                  ${status === s ? 'bg-white text-gold-600 shadow-sm' : 'text-ink-400 hover:text-ink-600'}`}>
                {s ? s.toUpperCase() : 'ALL'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden bg-white shadow-sm border-ink-100">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-ink-300" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-ink-400 italic">No members found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/50 border-b border-ink-100">
                <tr>
                  {['Member', 'Email', 'Status', 'Active Borrows', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-ink-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-ink-50/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        
                        {/* Dynamic Member Profile Picture Ring */}
                        <div className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center text-ink-700 font-bold text-xs overflow-hidden border border-ink-200/50 flex-shrink-0">
                          {u.avatar_url ? (
                            <img 
                              src={u.avatar_url} 
                              alt={u.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback configuration if image link string fails or drops
                                e.target.style.display = 'none';
                                e.target.parentElement.innerText = u.name?.[0]?.toUpperCase() || 'M';
                              }}
                            />
                          ) : (
                            u.name?.[0]?.toUpperCase()
                          )}
                        </div>

                        <p className="font-medium text-ink-800">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-500">{u.email}</td>
                    <td className="px-5 py-3">{statusBadge(u.status)}</td>
                    <td className="px-5 py-3 text-ink-600">{u.active_borrows || 0}</td>
                    <td className="px-5 py-3 text-ink-400 whitespace-nowrap">
                      {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        {u.status !== 'active' && (
                          <button
                            onClick={() => updateStatus(u.id, 'active')}
                            disabled={updatingId === u.id}
                            className="flex items-center gap-1 px-3 py-1 bg-jade-100 text-jade-700 rounded-lg text-xs hover:bg-jade-200 transition-colors">
                            {updatingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                            Approve
                          </button>
                        )}
                        {u.status !== 'suspended' && (
                          <button
                            onClick={() => updateStatus(u.id, 'suspended')}
                            disabled={updatingId === u.id}
                            className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200 transition-colors">
                            <UserX className="w-3 h-3" /> Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}