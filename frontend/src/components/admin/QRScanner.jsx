import { useEffect, useRef, useState } from 'react'
import { CloseIcon, CameraIcon, SpinnerIcon, CheckIcon, WarningIcon, QRIcon, SwapIcon } from '../shared/Icons'
import api from '../../services/api'
import toast from 'react-hot-toast'

/**
 * QRScanner — Admin only
 *
 * Flow A (Book QR scanned):
 *   → Show book info
 *   → Admin picks: "Issue to member" OR "Process Return"
 *   → If Issue: select user → confirm
 *   → If Return: select from that book's active borrows → confirm
 *
 * Flow B (Borrow/Transaction QR scanned):
 *   → Auto-route to Return step with txn pre-filled
 *
 * Flow C (Quick Return from list):
 *   → Click any active borrow row → goes straight to return confirm
 */
export default function QRScanner({ onClose, onSuccess }) {
  const scannerInst = useRef(null)
  // steps: choose | camera | action | issue | return | done
  const [step,       setStep]       = useState('choose')
  const [scanned,    setScanned]    = useState(null)      // { type:'book'|'txn', bookId, title, isbn, txnId, bookTitle }
  const [action,     setAction]     = useState(null)      // 'issue' | 'return' — chosen after book scan
  const [users,      setUsers]      = useState([])
  const [bookTxns,   setBookTxns]   = useState([])        // active borrows for a specific book (for return)
  const [allTxns,    setAllTxns]    = useState([])        // all active borrows (for quick return list)
  const [selUser,    setSelUser]    = useState('')
  const [selTxn,     setSelTxn]     = useState('')
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState(null)

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data.users || [])).catch(() => {})
    api.get('/transactions', { params: { status: 'borrowed' } })
       .then(r => setAllTxns(r.data.transactions || [])).catch(() => {})
    return () => stopCamera()
  }, [])

  const stopCamera = () => {
    if (scannerInst.current) {
      scannerInst.current.clear().catch(() => {})
      scannerInst.current = null
    }
  }

  // After scanning a book QR and selecting "Return",
  // fetch that book's currently borrowed transactions
  const fetchBookTxns = async (bookId) => {
    try {
      const { data } = await api.get('/transactions', { params: { status: 'borrowed', book_id: bookId } })
      setBookTxns(data.transactions || [])
    } catch { setBookTxns([]) }
  }

  const handleScannedData = (text) => {
    stopCamera()
    try {
      // Try JSON first (book QR from admin panel)
      const d = JSON.parse(text)
      if (d.bookId || d.book_id) {
        setScanned({ type: 'book', bookId: d.bookId || d.book_id, title: d.title, isbn: d.isbn })
        setStep('action') // Admin picks: Issue or Return
        return
      }
      if (d.transaction_id || d.type === 'borrow_transaction') {
        setScanned({ type: 'txn', txnId: d.transaction_id, bookTitle: d.book_title || d.BOOK })
        setSelTxn(d.transaction_id)
        setStep('return')
        return
      }
    } catch (_) {
      // Not JSON — try to parse the multi-line text format from BorrowQRModal
      // Format: "BOOK: ...\nAUTHOR: ...\nISBN: ...\nISSUED: ...\nDUE: ...\nTXN: ..."
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const get = (key) => {
        const line = lines.find(l => l.startsWith(key + ':'))
        return line ? line.replace(key + ':', '').trim() : ''
      }
      const txnId = get('TXN')
      const bookTitle = get('BOOK')
      if (txnId) {
        setScanned({ type: 'txn', txnId, bookTitle })
        setSelTxn(txnId)
        setStep('return')
        return
      }
    }
    toast.error('Unknown QR format — could not identify book or transaction')
  }

  const startCamera = async () => {
    setStep('camera')
    setTimeout(async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode')
        const s = new Html5QrcodeScanner('qr-cam', { fps: 10, qrbox: 240 }, false)
        s.render(
          text => handleScannedData(text),
          () => {}
        )
        scannerInst.current = s
      } catch { toast.error('Camera unavailable'); setStep('choose') }
    }, 300)
  }

  // Admin chose action after scanning a book QR
  const selectAction = async (act) => {
    setAction(act)
    if (act === 'return' && scanned?.bookId) {
      await fetchBookTxns(scanned.bookId)
    }
    setStep(act) // 'issue' or 'return'
  }

  const issueBook = async () => {
    if (!selUser) return toast.error('Select a member')
    setLoading(true)
    try {
      const { data } = await api.post('/transactions/issue', { book_id: scanned.bookId, user_id: selUser })
      setResult({ ok: true, msg: `Issued successfully! Due: ${new Date(data.transaction.due_date).toDateString()}` })
      setStep('done'); onSuccess?.()
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.error || 'Issue failed' })
      setStep('done')
    } finally { setLoading(false) }
  }

  const returnBook = async () => {
    const txnId = selTxn.trim()
    if (!txnId) return toast.error('Select a transaction to return')
    setLoading(true)
    try {
      const { data } = await api.post('/transactions/return', { transaction_id: txnId })
      const fine = data.fine_amount > 0 ? ` Fine: PKR ${data.fine_amount.toFixed(0)}` : ''
      setResult({ ok: true, msg: `Book returned successfully!${fine}` })
      setStep('done'); onSuccess?.()
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.error || 'Return failed' })
      setStep('done')
    } finally { setLoading(false) }
  }

  const reset = () => {
    stopCamera()
    setStep('choose'); setScanned(null); setAction(null)
    setSelUser(''); setSelTxn(''); setResult(null); setBookTxns([])
  }

  // Active borrows shown in quick-return list (homepage of scanner)
  const quickReturnList = allTxns.slice(0, 50)

  // For the return step: if we have a specific book's txns, show those; else show all
  const returnOptions = bookTxns.length > 0 ? bookTxns : allTxns

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(14,28,47,.6)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-lg card anim-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--c-navy)' }}>
            <QRIcon size={18} color="var(--c-gold-lt)"/>
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-base" style={{ color: 'var(--c-ink)' }}>
              Issue / Return Books
            </p>
            <p className="text-xs" style={{ color: 'var(--c-ink-muted)' }}>
              {step === 'choose' && 'Scan QR or select from active borrows'}
              {step === 'camera' && 'Scanning — point at Book QR or Member QR'}
              {step === 'action' && `Book identified: ${scanned?.title}`}
              {step === 'issue' && 'Select member to issue to'}
              {step === 'return' && 'Select transaction to return'}
              {step === 'done' && 'Operation complete'}
            </p>
          </div>
          <button onClick={() => { stopCamera(); onClose() }}
            className="p-2 rounded-xl hover:bg-cream-dark transition-colors">
            <CloseIcon size={16} color="var(--c-ink-soft)"/>
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">

          {/* ── CHOOSE ── */}
          {step === 'choose' && (
            <div className="space-y-4">
              <button onClick={startCamera}
                className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all border hover:shadow-md"
                style={{ border: '1.5px solid var(--c-border)', background: 'var(--c-surface)' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--c-navy)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--c-border)'}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(14,28,47,.08)' }}>
                  <CameraIcon size={20} color="var(--c-navy)"/>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm" style={{ color: 'var(--c-ink)' }}>Scan QR Code</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--c-ink-muted)' }}>
                    Scan any Book Asset QR or Member Borrow QR
                  </p>
                </div>
              </button>

              {/* Quick Return List */}
              <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 16 }}>
                <p className="font-semibold text-sm mb-3" style={{ color: 'var(--c-ink)' }}>
                  Quick Return — Active Borrows
                </p>
                {quickReturnList.length === 0
                  ? <p className="text-sm text-center py-4" style={{ color: 'var(--c-ink-muted)' }}>
                      No active borrows right now
                    </p>
                  : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {quickReturnList.map(t => (
                        <button key={t.id}
                          onClick={() => {
                            setSelTxn(t.id)
                            setScanned({ type: 'txn', txnId: t.id, bookTitle: t.book_title })
                            setStep('return')
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                          style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(14,28,47,.07)'}
                          onMouseOut={e => e.currentTarget.style.background = 'var(--c-surface2)'}>
                          <SwapIcon size={16} color="var(--c-ink-soft)"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--c-ink)' }}>
                              {t.book_title}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--c-ink-muted)' }}>
                              {t.user_name} · Due {new Date(t.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded flex-shrink-0"
                                style={{ background: 'var(--c-border)', color: 'var(--c-ink-soft)' }}>
                            {t.id.slice(0,8)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          )}

          {/* ── CAMERA ── */}
          {step === 'camera' && (
            <div className="space-y-3">
              <p className="text-sm text-center" style={{ color: 'var(--c-ink-soft)' }}>
                Scan a Book Asset QR (to issue or return) or a Member's Borrow QR (to return)
              </p>
              <div id="qr-cam" className="w-full rounded-2xl overflow-hidden"/>
              <button onClick={() => { stopCamera(); setStep('choose') }} className="btn-ghost w-full">
                ← Back
              </button>
            </div>
          )}

          {/* ── ACTION CHOICE (after Book QR scanned) ── */}
          {step === 'action' && scanned && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(27,138,90,.08)', border: '1px solid rgba(27,138,90,.2)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--c-green)' }}>✓ Book Identified</p>
                <p className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>{scanned.title || 'Unknown Book'}</p>
                {scanned.isbn && <p className="text-xs mt-0.5" style={{ color: 'var(--c-ink-muted)' }}>ISBN: {scanned.isbn}</p>}
              </div>
              
              <p className="text-sm font-semibold text-center" style={{ color: 'var(--c-ink)' }}>
                What would you like to do?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => selectAction('issue')}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl transition-all border hover:shadow-md"
                  style={{ border: '1.5px solid var(--c-border)', background: 'var(--c-surface)' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--c-navy)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--c-border)'}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(14,28,47,.08)' }}>
                    <QRIcon size={20} color="var(--c-navy)"/>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm" style={{ color: 'var(--c-ink)' }}>Issue Book</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--c-ink-muted)' }}>Lend to a member</p>
                  </div>
                </button>
                <button onClick={() => selectAction('return')}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl transition-all border hover:shadow-md"
                  style={{ border: '1.5px solid var(--c-border)', background: 'var(--c-surface)' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--c-gold)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--c-border)'}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(217,119,6,.08)' }}>
                    <SwapIcon size={20} color="var(--c-gold)"/>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm" style={{ color: 'var(--c-ink)' }}>Return Book</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--c-ink-muted)' }}>Process a return</p>
                  </div>
                </button>
              </div>

              <button onClick={reset} className="btn-ghost w-full text-sm">← Back</button>
            </div>
          )}

          {/* ── ISSUE ── */}
          {step === 'issue' && scanned && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(27,138,90,.08)', border: '1px solid rgba(27,138,90,.2)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--c-green)' }}>Issuing</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--c-ink)' }}>{scanned.title || 'Unknown Title'}</p>
                {scanned.isbn && <p className="text-xs" style={{ color: 'var(--c-ink-muted)' }}>ISBN: {scanned.isbn}</p>}
              </div>
              <div>
                <label className="label">Issue to Member</label>
                <select className="input" value={selUser} onChange={e => setSelUser(e.target.value)}>
                  <option value="">— Select active member —</option>
                  {users.filter(u => u.status === 'active').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('action')} className="btn-ghost flex-1">← Back</button>
                <button onClick={issueBook} disabled={loading || !selUser} className="btn-gold flex-1">
                  {loading && <SpinnerIcon size={14} color="#fff"/>}
                  {loading ? 'Issuing…' : 'Confirm Issue'}
                </button>
              </div>
            </div>
          )}

          {/* ── RETURN ── */}
          {step === 'return' && (
            <div className="space-y-4">
              {scanned?.bookTitle && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(14,28,47,.06)', border: '1px solid var(--c-border)' }}>
                  <p className="text-xs font-bold" style={{ color: 'var(--c-navy)' }}>Returning</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--c-ink)' }}>{scanned.bookTitle}</p>
                </div>
              )}

              {/* If came from book scan: show that book's active borrows */}
              {scanned?.type === 'book' && returnOptions.length > 0 && (
                <div>
                  <label className="label">Select Borrower to Return</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {returnOptions.map(t => (
                      <button key={t.id}
                        onClick={() => setSelTxn(t.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{ 
                          background: selTxn === t.id ? 'rgba(14,28,47,.08)' : 'var(--c-surface2)', 
                          border: `1px solid ${selTxn === t.id ? 'var(--c-navy)' : 'var(--c-border)'}` 
                        }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: 'var(--c-ink)' }}>{t.user_name}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--c-ink-muted)' }}>
                            Due {new Date(t.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        {selTxn === t.id && <CheckIcon size={14} color="var(--c-navy)"/>}
                      </button>
                    ))}
                  </div>
                  {returnOptions.length === 0 && (
                    <p className="text-xs text-center py-3" style={{ color: 'var(--c-ink-muted)' }}>
                      No active borrows found for this book
                    </p>
                  )}
                </div>
              )}

              {/* If came from member QR or direct select: txn is pre-filled */}
              {scanned?.type === 'txn' && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--c-ink-muted)' }}>Transaction ID</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--c-ink)' }}>{selTxn}</p>
                </div>
              )}

              {/* For quick-return from list (no scanned object, txn pre-selected) */}
              {!scanned && selTxn && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--c-ink-muted)' }}>Transaction ID</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--c-ink)' }}>{selTxn}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={reset} className="btn-ghost flex-1">← Back</button>
                <button onClick={returnBook} disabled={loading || !selTxn.trim()} className="btn-navy flex-1">
                  {loading && <SpinnerIcon size={14} color="var(--c-gold-lt)"/>}
                  {loading ? 'Processing…' : 'Confirm Return'}
                </button>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && result && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                   style={{ background: result.ok ? 'rgba(27,138,90,.12)' : 'rgba(214,64,69,.12)' }}>
                {result.ok
                  ? <CheckIcon size={28} color="var(--c-green)"/>
                  : <WarningIcon size={28} color="var(--c-red)"/>
                }
              </div>
              <p className="text-center font-semibold text-sm"
                 style={{ color: result.ok ? 'var(--c-green)' : 'var(--c-red)' }}>
                {result.msg}
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={reset} className="btn-ghost flex-1">Next Transaction</button>
                <button onClick={() => { stopCamera(); onClose() }} className="btn-navy flex-1">Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}