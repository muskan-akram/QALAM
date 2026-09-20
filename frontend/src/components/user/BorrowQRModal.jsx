import { CloseIcon, DownloadIcon, CheckIcon } from '../shared/Icons'
import { format } from 'date-fns'
import { QRCodeCanvas } from 'qrcode.react'

/**
 * BorrowQRModal
 * Shown to the user when their borrow request is approved (status: 'borrowed').
 * The QR encodes a JSON payload that the admin QRScanner can parse to process a return.
 */
export default function BorrowQRModal({ transaction, book, onClose }) {
  if (!transaction) return null

  const issueDate = format(new Date(transaction.borrow_date || Date.now()), 'yyyy-MM-dd HH:mm')
  const dueDate   = transaction.due_date ? format(new Date(transaction.due_date), 'yyyy-MM-dd') : 'N/A'
  
  // JSON format — QRScanner parses transaction_id to route straight to return
  const qrPayload = JSON.stringify({
    type: 'borrow_transaction',
    transaction_id: transaction.id,
    book_id: transaction.book_id,
    book_title: book?.title,
    isbn: book?.isbn || null,
    issued: issueDate,
    due: dueDate
  })

  const downloadQR = () => {
    const canvas = document.getElementById('borrow-qr-canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `Borrow-QR-${transaction.id?.slice(0, 8)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm">
      <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="font-display font-bold text-sm text-ink">Borrow Receipt</p>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md">
            <CloseIcon size={14} color="var(--c-ink-soft)"/>
          </button>
        </div>

        <div className="p-5 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
            <CheckIcon size={20} color="var(--c-green)"/>
          </div>

          <p className="font-display font-bold text-base text-ink text-center line-clamp-2 mb-1 px-2">
            {book?.title}
          </p>
          {book?.author && (
            <p className="text-[10px] text-ink-muted mb-4">by {book.author}</p>
          )}

          {/* QR Code */}
          <div className="p-2 bg-white border-2 border-gray-50 rounded-xl mb-4">
            <QRCodeCanvas 
              id="borrow-qr-canvas" 
              value={qrPayload} 
              size={160} 
              level="M"
              includeMargin={false}
            />
          </div>

          <p className="text-[9px] text-ink-muted text-center mb-3 px-4 leading-relaxed">
            Show this to the librarian when collecting or returning the book
          </p>

          {/* Details Card */}
          <div className="w-full bg-gray-50 rounded-xl p-3 space-y-1.5 mb-5 border border-gray-100">
            <div className="flex justify-between text-[10px]">
              <span className="text-ink-muted uppercase font-bold">Issued</span>
              <span className="text-ink font-semibold">{issueDate}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-ink-muted uppercase font-bold">Return By</span>
              <span className="text-red-600 font-bold">{dueDate}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-ink-muted uppercase font-bold">Txn ID</span>
              <span className="text-ink font-mono">{transaction.id?.slice(0,12)}…</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <button onClick={downloadQR} className="flex-1 btn-gold text-xs py-2.5 h-auto gap-2">
              <DownloadIcon size={12} color="#fff"/> Save PNG
            </button>
            <button onClick={onClose} className="flex-1 btn-ghost text-xs py-2.5 h-auto border-gray-200">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}