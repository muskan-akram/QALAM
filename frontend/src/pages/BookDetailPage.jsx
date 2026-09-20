import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Clock, 
  BookOpen, 
  RotateCcw,
  CheckCircle2,
  X,
  Trash2
} from 'lucide-react'
import {
  ArrowLeft, QRIcon, BookStack, MapPinIcon, HashIcon, GlobeIcon,
  SpinnerIcon, TrashIcon, DownloadIcon, CheckIcon
} from '../components/shared/Icons'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import QRScanner from '../components/admin/QRScanner'
import BorrowQRModal from '../components/user/BorrowQRModal'

/* Reusable Cover logic */
const DetailCover = ({ book }) => {
  const [src, setSrc] = useState(null)
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (book.cover_url) { setSrc(book.cover_url); return }
    if (book.isbn) {
      const clean = book.isbn.replace(/[^0-9X]/gi, '')
      setSrc(`https://covers.openlibrary.org/b/isbn/${clean}-M.jpg`)
    }
  }, [book.isbn, book.cover_url])

  const colors = ['#6B2737','#4A6741','#B8892A','#4A1824','#2C4A3E','#4A3520']
  const bg = colors[Math.abs(book.title.charCodeAt(0)) % colors.length]

  return (
    <div className="w-full h-full relative" style={{ background: bg }}>
      {src && !error && (
        <img src={src} alt={book.title}
             className="w-full h-full object-cover transition-opacity duration-300"
             style={{ opacity: loaded ? 1 : 0 }}
             onLoad={() => setLoaded(true)}
             onError={() => setError(true)} />
      )}
      {(!src || error) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-3">
          <BookStack size={48} color="rgba(255,255,255,.4)"/>
          <p className="text-center font-display italic text-sm text-white/70">{book.title}</p>
        </div>
      )}
    </div>
  )
}

export default function BookDetailPage() {
  const { id } = useParams()
  const { isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdminQR, setShowAdminQR] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showBorrow, setShowBorrow] = useState(false)
  const [activeTxn, setActiveTxn] = useState(null)
  const [requesting, setRequesting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const fetchBook = () => {
    setLoading(true)
    api.get(`/books/${id}`).then(r => setBook(r.data.book)).finally(() => setLoading(false))
  }

  const fetchUserStatus = () => {
    if (user) {
      api.get('/transactions').then(r => {
        const mine = (r.data.transactions || []).find(t => 
          t.book_id === id && (t.status === 'borrowed' || t.status === 'pending')
        )
        setActiveTxn(mine || null)
      }).catch(() => {})
    }
  }

  useEffect(() => { fetchBook() }, [id])
  useEffect(() => { fetchUserStatus() }, [id, isAdmin, user])

  const handleRequestBorrow = async () => {
    setRequesting(true)
    try {
      const { data } = await api.post('/transactions/request', { 
        book_id: id,
        user_id: user.id 
      })
      setActiveTxn(data.transaction)
      toast.success('Request sent! Waiting for admin approval.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send request')
    } finally { setRequesting(false) }
  }

  const handleCancelRequest = () => {
    setShowCancelConfirm(true)
  }

  const handleConfirmCancel = async () => {
    setShowCancelConfirm(false)
    setCancelling(true)
    try {
      await api.patch(`/transactions/${activeTxn.id}/cancel`)
      setActiveTxn(null)
      toast.success('Request cancelled.')
      fetchBook()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not cancel request')
    } finally { setCancelling(false) }
  }

  const handleDeletePermanent = async () => {
    setDeleting(true)
    try {
      await api.delete(`/books/${id}`)
      toast.success('Book deleted successfully')
      setShowDeleteConfirm(false)
      navigate('/admin/books')
    } catch { 
      toast.error('Delete failed')
    } finally {
      setDeleting(false) 
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <SpinnerIcon size={32} className="animate-spin" color="var(--c-gold)"/>
    </div>
  )
  
  if (!book) return <div className="text-center py-20 text-ink-soft font-display">Book not found</div>

  const available = book.available_copies > 0
  const qrSourceData = book.qr_code_data || book.qr_code;

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm mb-6 text-ink-soft hover:text-ink transition-colors font-medium">
        <ArrowLeft size={16} color="currentColor"/> Back to library
      </button>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          <div className="card overflow-hidden shadow-xl border-0 ring-1 ring-ink/5 bg-white">
            <div className="aspect-[2/3]">
              <DetailCover book={book} />
            </div>
            <div className="p-4 bg-white">
              <div className="w-full py-2.5 rounded-xl text-[11px] font-bold text-center tracking-tight"
                   style={{ 
                     background: available ? 'rgba(27,138,90,.06)' : 'rgba(214,64,69,.06)',
                     color: available ? 'var(--c-green)' : 'var(--c-red)'
                   }}>
                {available ? `${book.available_copies} of ${book.total_copies} Available` : 'All Copies Borrowed'}
              </div>
            </div>
          </div>

          {/* USER INTERACTION CARD */}
          {!isAdmin && (
            <div className="card p-4 space-y-3 bg-white shadow-sm border-ink-50">
              {activeTxn?.status === 'pending' ? (
                <div className="space-y-3">
                  <div className="p-5 rounded-2xl text-center space-y-3 border border-amber-100" style={{ background: '#FFFDF5' }}>
                    <div className="relative mx-auto w-10 h-10">
                      <Clock className="w-10 h-10 text-amber-400 absolute inset-0 animate-ping opacity-20" />
                      <Clock className="w-10 h-10 text-amber-500 relative z-10" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-900">Approval Pending</p>
                      <p className="text-[10px] text-amber-600 font-medium leading-relaxed mt-1 uppercase tracking-tighter">
                        Requested on {new Date(activeTxn.borrow_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleCancelRequest} 
                    disabled={cancelling}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-500 border border-red-100 bg-red-50 hover:bg-red-100 transition-all active:scale-[0.98]"
                  >
                    {cancelling 
                      ? <SpinnerIcon size={14} className="animate-spin"/> 
                      : <X size={14}/>
                    }
                    Cancel Request
                  </button>
                </div>
              ) : activeTxn?.status === 'borrowed' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-green-700 bg-green-50 border border-green-100">
                    <CheckCircle2 size={16} /> Ready to Collect
                  </div>
                  <button onClick={() => setShowBorrow(true)} 
                    className="btn-gold w-full flex items-center justify-center gap-2 py-3.5 shadow-gold/20 shadow-lg">
                    <QRIcon size={18} color="white"/> View My QR Code
                  </button>
                </div>
              ) : available ? (
                <button onClick={handleRequestBorrow} disabled={requesting}
                  className="w-full py-4 bg-ink text-gold rounded-2xl font-bold hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  {requesting ? <SpinnerIcon size={20} className="animate-spin"/> : 'Request to Borrow'}
                </button>
              ) : (
                <div className="p-4 bg-ink-50 text-ink-muted text-center rounded-2xl text-xs font-medium italic border border-ink-100">
                  Currently out of stock
                </div>
              )}
            </div>
          )}

          {/* ADMIN SUITE PANEL */}
          {isAdmin && (
            <div className="card p-5 bg-white shadow-sm border border-ink-100 rounded-2xl space-y-3.5 flex flex-col box-border">
              <p className="text-[10px] font-black text-ink-soft uppercase tracking-[0.15em] mb-1 px-1">Librarian Suite</p>
              
              {/* View Asset QR Code Button Line */}
              <button 
                onClick={() => {
                  if (!activeTxn) {
                    toast.error("No active borrowing transaction record found for this asset item.");
                    return;
                  }
                  setShowBorrow(true);
                }} 
                className="w-full h-12 flex items-center justify-center gap-2.5 px-4 border border-ink bg-white hover:bg-ink-50 text-ink active:scale-[0.98] rounded-xl text-xs font-bold transition-all"
              >
                <QRIcon size={15} /> 
                <span>View Asset QR</span>
              </button>
              
              {/* Open Scanner Button Line */}
              <button 
                onClick={() => setShowScanner(true)} 
                className="w-full h-12 flex items-center justify-center gap-2.5 px-4 bg-gold text-white hover:bg-gold-600 active:scale-[0.98] rounded-xl text-xs font-black transition-all shadow-sm"
              >
                <QRIcon size={15} color="white" /> 
                <span>Open Scanner</span>
              </button>
              
              <div className="pt-2 border-t border-ink-50 mt-1">
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="w-full h-10 flex items-center justify-center gap-2 px-3 text-xs font-bold text-red-500 hover:bg-red-50/50 rounded-xl transition-all"
                >
                  <TrashIcon size={14}/>
                  <span>Delete Book</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="card p-8 lg:p-10 bg-white border-0 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-50/50 rounded-bl-full -mr-16 -mt-16 z-0" />
            
            <div className="relative z-10">
              <div className="flex gap-2 mb-6">
                <span className="px-3 py-1 bg-ink-50 text-ink-400 rounded-full text-[10px] font-bold uppercase tracking-wider">{book.genre || 'Literature'}</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-display font-black text-ink leading-tight mb-4">{book.title}</h1>
              <p className="text-xl text-gold-600 font-display italic">by {book.author}</p>
              
              {book.description && (
                <div className="mt-10 pt-8 border-t border-ink-50">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-4">Synopsis</h4>
                  <p className="text-sm lg:text-base leading-relaxed text-ink-mid max-w-2xl">{book.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 bg-ink-50/30 border-dashed border-ink-200">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-6">Technical Specifications</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <DataPoint icon={HashIcon} label="ISBN-13" value={book.isbn} />
              <DataPoint icon={GlobeIcon} label="Language" value={book.language || 'English'} />
              <DataPoint icon={MapPinIcon} label="Library Location" value={book.location} />
              <DataPoint icon={BookOpen} label="Physical Copies" value={book.total_copies} />
            </dl>
          </div>
        </div>
      </div>

      {/* ADMIN INDEPENDENT ASSET ID QR MODAL */}
      {showAdminQR && qrSourceData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowAdminQR(false)}>
          <div className="card p-8 max-w-sm w-full text-center shadow-2xl bg-white border-0 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-black text-gold-600 uppercase tracking-[0.2em] mb-2">Internal Identity</p>
            <h3 className="font-display font-bold text-xl mb-6 text-ink">Asset Label QR</h3>
            <div className="p-4 bg-ink-50 rounded-3xl mb-8 ring-1 ring-ink/5">
               <img src={qrSourceData} alt="QR" className="w-52 h-52 mx-auto rounded-xl" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdminQR(false)} className="btn-ghost flex-1 py-3 text-xs">Dismiss</button>
              <button 
                onClick={() => {
                  const link = document.createElement('a')
                  link.download = `QR-${book.isbn || book.id?.slice(0,8)}.png`
                  link.href = qrSourceData
                  link.click()
                }} 
                className="btn-gold flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
              >
                <DownloadIcon size={12} color="#fff"/> Download
              </button>
            </div>
            <button onClick={() => window.print()} className="btn-ink w-full py-2.5 text-xs mt-2">Print Tag</button>
          </div>
        </div>
      )}

      {/* TRANSACTION QR MODAL */}
      {showBorrow && activeTxn && (
        <BorrowQRModal transaction={activeTxn} book={book} onClose={() => setShowBorrow(false)}/>
      )}

      {/* SCANNER MODAL */}
      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} onSuccess={fetchBook}/>
      )}

      {/* SCREEN-CENTERED CANCEL BORROW CONFIRMATION DIALOG MODAL */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 border border-ink-100 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 text-amber-600 mb-4">
              <Clock size={22} />
            </div>
            
            <h3 className="text-base font-bold text-ink-900 leading-tight">
              Cancel your borrow request?
            </h3>
            
            <p className="text-xs text-ink-400 mt-2 leading-relaxed">
              This will withdraw your pending request for "{book.title}". You will have to submit a new request if you change your mind.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 bg-ink-50 hover:bg-ink-100 text-ink-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-1"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN-CENTERED DELETION CONFIRMATION DIALOG MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 border border-ink-100 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600 mb-4">
              <Trash2 size={22} />
            </div>
            
            <h3 className="text-base font-bold text-ink-900 leading-tight">
              Delete "{book.title}" permanently?
            </h3>
            
            <p className="text-xs text-ink-400 mt-2 leading-relaxed">
              This action is permanent and completely irreversible. All metadata records and logs will be lost.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-ink-50 hover:bg-ink-100 text-ink-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeletePermanent}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-1"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DataPoint({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 items-start group">
      <div className="mt-1 p-2 bg-white rounded-lg shadow-sm border border-ink-50 group-hover:border-gold-200 transition-colors">
        <Icon size={14} color="var(--c-gold)"/>
      </div>
      <div>
        <dt className="text-[9px] font-black text-ink-muted uppercase tracking-widest mb-1">{label}</dt>
        <dd className="text-sm font-bold text-ink-900">{value}</dd>
      </div>
    </div>
  )
}