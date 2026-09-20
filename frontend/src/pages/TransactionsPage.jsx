import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Loader2, CheckCircle, QrCode, X } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import BorrowQRModal from '../components/user/BorrowQRModal'

const statusBadge = s => {
  const map = { 
    pending: 'bg-amber-100 text-amber-700 border-amber-200', 
    borrowed: 'bg-blue-100 text-blue-700 border-blue-200', 
    returned: 'bg-green-100 text-green-700 border-green-200', 
    overdue: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200'
  }
  return <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${map[s] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{s.toUpperCase()}</span>
}

export default function TransactionsPage() {
  const { isAdmin } = useAuth()
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [actionLoading, setActionLoading] = useState(null) // txn id being actioned
  const [selectedTxn, setSelectedTxn] = useState(null)    // for QR modal
  const [selectedBook, setSelectedBook] = useState(null)

  const fetchTxns = () => {
    setLoading(true)
    api.get('/transactions', { params: status ? { status } : {} })
      .then(r => setTxns(r.data.transactions || []))
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTxns() }, [status])

  // ADMIN: Approve pending request
  const handleApprove = async (id) => {
    setActionLoading(id + '_approve')
    try {
      await api.patch(`/transactions/${id}/approve`)
      toast.success('Request Approved! User has been notified.')
      fetchTxns()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed')
    } finally { setActionLoading(null) }
  }

  // ADMIN or USER: Cancel pending request
  const handleCancel = async (txn) => {
    const label = isAdmin ? `Cancel ${txn.user_name}'s request?` : 'Cancel your borrow request?'
    if (!confirm(label)) return
    setActionLoading(txn.id + '_cancel')
    try {
      await api.patch(`/transactions/${txn.id}/cancel`)
      toast.success('Request cancelled.')
      fetchTxns()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancel failed')
    } finally { setActionLoading(null) }
  }

  // Open QR modal: fetch book details first
  const handleViewQR = async (txn) => {
    try {
      const { data } = await api.get(`/books/${txn.book_id}`)
      setSelectedBook(data.book)
      setSelectedTxn(txn)
    } catch {
      // Fallback: build minimal book object from txn data
      setSelectedBook({ title: txn.book_title, author: txn.author, isbn: txn.isbn })
      setSelectedTxn(txn)
    }
  }

  const filterTabs = isAdmin 
    ? ['', 'pending', 'borrowed', 'returned']
    : ['', 'pending', 'borrowed', 'returned']

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">
            {isAdmin ? 'Library Transactions' : 'My Borrowing History'}
          </h1>
          <p className="text-ink-400 text-sm mt-1">{txns.length} records found</p>
        </div>

        {/* Status Filters */}
        <div className="flex gap-1 bg-ink-50 p-1 rounded-xl border border-ink-100 self-start">
          {filterTabs.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all
                ${status === s ? 'bg-white text-gold-600 shadow-sm' : 'text-ink-400 hover:text-ink-600'}`}>
              {s ? s.toUpperCase() : 'ALL'}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden bg-white shadow-sm border-ink-100">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : txns.length === 0 ? (
          <div className="py-20 text-center text-ink-300 italic">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/50 border-b border-ink-100">
                <tr>
                  {isAdmin && <th className="px-6 py-4 text-left text-[10px] font-black text-ink-400 uppercase tracking-widest">Member</th>}
                  <th className="px-6 py-4 text-left text-[10px] font-black text-ink-400 uppercase tracking-widest">Book Details</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-ink-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-ink-400 uppercase tracking-widest">Timeline</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-ink-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {txns.map(t => (
                  <tr key={t.id} className="hover:bg-ink-50/30 transition-colors">
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="font-bold text-ink-900">{t.user_name || 'Member'}</div>
                        <div className="text-[10px] text-ink-400 uppercase">ID: #{t.user_id?.slice(-4)}</div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <p className="font-bold text-ink-900 leading-tight">{t.book_title}</p>
                      <p className="text-ink-400 text-xs mt-0.5">{t.author}</p>
                    </td>
                    <td className="px-6 py-4">{statusBadge(t.status)}</td>
                    <td className="px-6 py-4 text-[11px] text-ink-500 leading-relaxed">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        {t.status === 'pending' ? 'Requested' : 'Borrowed'}: {format(new Date(t.borrow_date), 'MMM d, yyyy')}
                      </div>
                      {t.due_date && (
                        <div className="flex items-center gap-1.5 font-medium text-red-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          Due: {format(new Date(t.due_date), 'MMM d, yyyy')}
                        </div>
                      )}
                      {t.return_date && (
                        <div className="flex items-center gap-1.5 font-medium text-green-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          Returned: {format(new Date(t.return_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        
                        {/* ADMIN: Approve pending */}
                        {isAdmin && t.status === 'pending' && (
                          <button 
                            onClick={() => handleApprove(t.id)} 
                            disabled={actionLoading === t.id + '_approve'}
                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-md active:scale-95 disabled:opacity-60"
                          >
                            {actionLoading === t.id + '_approve' 
                              ? <Loader2 size={10} className="animate-spin"/> 
                              : <CheckCircle size={12}/>
                            }
                            APPROVE
                          </button>
                        )}

                        {/* ADMIN or USER: Cancel pending */}
                        {t.status === 'pending' && (
                          <button 
                            onClick={() => handleCancel(t)} 
                            disabled={actionLoading === t.id + '_cancel'}
                            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 disabled:opacity-60"
                          >
                            {actionLoading === t.id + '_cancel' 
                              ? <Loader2 size={10} className="animate-spin"/> 
                              : <X size={12}/>
                            }
                            CANCEL
                          </button>
                        )}

                        {/* QR CODE VIEW — available once admin has approved (borrowed) */}
                        {t.status === 'borrowed' && (
                          <button 
                            onClick={() => handleViewQR(t)}
                            className="p-2 hover:bg-gold-50 rounded-xl text-gold-600 transition-all group" 
                            title="View Transaction QR"
                          >
                            <QrCode size={20} className="group-hover:scale-110 transition-transform"/>
                          </button>
                        )}

                        {t.status === 'returned' && (
                           <span className="text-[10px] font-bold text-ink-300 uppercase italic">Archived</span>
                        )}

                        {t.status === 'cancelled' && (
                           <span className="text-[10px] font-bold text-ink-300 uppercase italic">Cancelled</span>
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

      {/* QR Modal */}
      {selectedTxn && selectedBook && (
        <BorrowQRModal 
          transaction={selectedTxn} 
          book={selectedBook} 
          onClose={() => { setSelectedTxn(null); setSelectedBook(null) }}
        />
      )}
    </div>
  )
}