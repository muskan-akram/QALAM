import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import AddBookModal from '../components/admin/AddBookModal'

const I = ({ d, size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
const ISearch = () => <I d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
const IPlus   = () => <I d="M12 5v14M5 12h14" />
const IBook   = ({ size = 32 }) => <I size={size} d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
const IClose  = () => <I d="M18 6L6 18M6 6l12 12" />
const ISpin   = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin .7s linear infinite' }}>
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
)

const GENRES = ['Technology','Science Fiction','Self-Help','Non-Fiction','Fiction','History','Biography','Science','Philosophy','Psychology','Business','Art']

/* Get cover from Open Library if isbn available, fallback to generated gradient cover */
const CoverImg = ({ book }) => {
  const [src,    setSrc]    = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [error,  setError]  = useState(false)

  useEffect(() => {
    if (book.cover_url) { setSrc(book.cover_url); return }
    if (book.isbn) {
      const clean = book.isbn.replace(/[^0-9X]/gi, '')
      setSrc(`https://covers.openlibrary.org/b/isbn/${clean}-M.jpg`)
    }
  }, [book.isbn, book.cover_url])

  const colors = ['#6B2737','#4A6741','#B8892A','#4A1824','#2C4A3E','#4A3520']
  const bg = colors[Math.abs(book.title.charCodeAt(0) + book.title.charCodeAt(1)) % colors.length]

  return (
    <div className="w-full h-full relative" style={{ background: bg }}>
      {src && !error && (
        <img src={src} alt={book.title}
             className="w-full h-full object-cover transition-opacity duration-300"
             style={{ opacity: loaded ? 1 : 0 }}
             onLoad={() => setLoaded(true)}
             onError={() => setError(true)} />
      )}
      {(!src || error || !loaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 gap-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <p className="text-center font-display italic text-xs leading-snug" style={{ color: 'rgba(255,255,255,.7)' }}>{book.title}</p>
        </div>
      )}
    </div>
  )
}

function BookCard({ book, isAdmin }) {
  const base = isAdmin ? '/admin' : '/dashboard'
  const avail = book.available_copies > 0
  return (
    <Link to={`${base}/books/${book.id}`} style={{ textDecoration: 'none' }}
      className="card card-lift group flex flex-col overflow-hidden cursor-pointer">
      <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
        <CoverImg book={book} />
        <div className="absolute top-2 right-2">
          <span className="badge" style={{ background: avail ? 'rgba(74,103,65,.9)' : 'rgba(184,50,50,.85)', color: '#fff', fontSize: 9, backdropFilter: 'blur(4px)' }}>
            {avail ? `${book.available_copies} left` : 'Unavailable'}
          </span>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3"
             style={{ background: 'linear-gradient(to top, rgba(28,16,8,.8) 0%, transparent 60%)' }}>
          <span className="text-xs font-semibold text-white">{avail ? 'Borrow →' : 'View details'}</span>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-1">
        {book.genre && <span className="badge badge-burg self-start" style={{ fontSize: 9 }}>{book.genre}</span>}
        <p className="font-display font-semibold text-sm leading-snug line-clamp-2 mt-0.5"
           style={{ color: 'var(--ink)', fontFamily: "'Cormorant',serif" }}>{book.title}</p>
        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{book.author}</p>
      </div>
    </Link>
  )
}

export default function BooksPage() {
  const { isAdmin } = useAuth()
  const [books,     setBooks]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [genre,     setGenre]     = useState('')
  const [avail,     setAvail]     = useState(false)
  const [page,      setPage]      = useState(1)
  const [total,     setTotal]     = useState(0)
  const [showAdd,   setShowAdd]   = useState(false)
  const debounce    = useRef(null)

  const fetch = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 24 }
      if (search) params.search = search
      if (genre)  params.genre  = genre
      if (avail)  params.available = 'true'
      const { data } = await api.get('/books', { params })
      setBooks(data.books); setTotal(data.pagination?.total || 0)
    } finally { setLoading(false) }
  }, [search, genre, avail])

  useEffect(() => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => { setPage(1); fetch(1) }, 320)
    return () => clearTimeout(debounce.current)
  }, [search, genre, avail])

  useEffect(() => { fetch(page) }, [page])

  const clear = () => { setSearch(''); setGenre(''); setAvail(false) }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Library Catalogue</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>{total} titles · {isAdmin ? 'Admin view' : 'Browse and borrow'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)}
            className="btn-burg"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 14,
              fontWeight: 700, fontSize: 14, letterSpacing: 0.3,
              boxShadow: '0 2px 12px rgba(139,50,50,.25)',
              transition: 'box-shadow .2s, transform .15s',
            }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,50,50,.38)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(139,50,50,.25)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: 7,
              background: 'rgba(255,255,255,.18)',
            }}>
              <IPlus />
            </span>
            Add Book
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-muted)', pointerEvents: 'none' }}>
            <ISearch />
          </span>
          <input className="input pl-10" placeholder="Search title, author, ISBN…"
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 'auto', minWidth: 140 }}
                value={genre} onChange={e => setGenre(e.target.value)}>
          <option value="">All Genres</option>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none px-4 py-2.5 rounded-xl border transition-all"
               style={{ border: `1.5px solid ${avail ? 'var(--burg)' : 'var(--border)'}`, background: avail ? 'var(--burg-ghost)' : 'var(--surface)', color: avail ? 'var(--burg)' : 'var(--ink-soft)' }}>
          <input type="checkbox" className="hidden" checked={avail} onChange={e => setAvail(e.target.checked)} />
          <span className="text-sm font-medium">Available only</span>
        </label>
        {(search || genre || avail) && (
          <button onClick={clear} className="btn-ghost px-3" style={{ color: 'var(--red)' }}>
            <IClose /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><ISpin /></div>
      ) : books.length === 0 ? (
        <div className="card p-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface2)', color: 'var(--ink-muted)' }}>
            <IBook size={30} />
          </div>
          <p className="font-display text-xl font-bold" style={{ color: 'var(--ink-soft)' }}>No books found</p>
          <button onClick={clear} className="btn-ghost">Clear filters</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {books.map(b => <BookCard key={b.id} book={b} isAdmin={isAdmin} />)}
          </div>
          {total > 24 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-4 py-2 text-sm">← Prev</button>
              <span className="text-sm px-3" style={{ color: 'var(--ink-soft)' }}>Page {page} of {Math.ceil(total / 24)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 24)} className="btn-ghost px-4 py-2 text-sm">Next →</button>
            </div>
          )}
        </>
      )}
      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} onSuccess={() => fetch(1)} />}
    </div>
  )
}