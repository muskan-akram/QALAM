import { useEffect, useState } from 'react'
import { Loader2, BookOpen, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts'
import api from '../services/api'

// ── QALAM brand palette ───────────────────────────────────────────────────────
const GENRE_COLORS = [
  '#C8993A', // gold
  '#1a2b40', // navy
  '#2e7d52', // green
  '#8b5cf6', // purple
  '#ef4444', // red
  '#0ea5e9', // sky
  '#f97316', // orange
  '#14b8a6', // teal
  '#ec4899', // pink
  '#6366f1', // indigo
  '#84cc16', // lime
  '#f59e0b', // amber
]

// ── Smart data extractor: handles any backend field naming ───────────────────
function extractData(raw) {
  if (!raw) return { summary: {}, genreStats: [], topBooks: [], monthlyActivity: [], overdueCount: 0 }

  const summary = raw.summary || raw.stats || raw.overview || {}

  const totalBooks =
    summary.total_books ?? summary.totalBooks ?? summary.books ??
    raw.total_books ?? raw.totalBooks ?? raw.books_count ?? null

  const totalMembers =
    summary.total_members ?? summary.totalMembers ?? summary.members ??
    summary.total_users ?? summary.users ??
    raw.total_members ?? raw.totalMembers ?? raw.users_count ?? null

  const activeBorrows =
    summary.active_borrows ?? summary.activeBorrows ?? summary.borrowed ??
    summary.current_borrows ?? raw.active_borrows ?? raw.activeBorrows ?? null

  const totalBorrows =
    summary.total_borrows ?? summary.totalBorrows ?? summary.all_time_borrows ??
    raw.total_borrows ?? null

  let genreStats =
    raw.genreStats ?? raw.genre_stats ?? raw.genres ??
    raw.booksByGenre ?? raw.books_by_genre ??
    summary.genreStats ?? summary.genre_stats ?? []

  genreStats = (Array.isArray(genreStats) ? genreStats : []).map(g => ({
    genre: g.genre ?? g.name ?? g.label ?? g._id ?? 'Unknown',
    count: Number(g.count ?? g.total ?? g.value ?? g.books ?? 1),
  })).filter(g => g.count > 0)

  let topBooks =
    raw.topBooks ?? raw.top_books ?? raw.popularBooks ?? raw.popular_books ??
    raw.mostBorrowed ?? raw.most_borrowed ?? []

  topBooks = (Array.isArray(topBooks) ? topBooks : []).map(b => ({
    title: (b.title ?? b.name ?? 'Unknown').slice(0, 22) + ((b.title ?? '').length > 22 ? '…' : ''),
    borrow_count: Number(b.borrow_count ?? b.borrowCount ?? b.count ?? b.borrows ?? 1),
    author: b.author ?? '',
  }))

  let monthlyActivity =
    raw.monthlyActivity ?? raw.monthly_activity ?? raw.borrowActivity ??
    raw.borrow_activity ?? raw.activity ?? []

  monthlyActivity = (Array.isArray(monthlyActivity) ? monthlyActivity : []).map(m => ({
    month: m.month ?? m.date ?? m.period ?? m.label ?? '',
    borrows: Number(m.borrows ?? m.count ?? m.total ?? 0),
  }))

  const overdueCount =
    raw.overdueCount ?? raw.overdue_count ??
    (Array.isArray(raw.overdueUsers) ? raw.overdueUsers.length : null) ??
    (Array.isArray(raw.overdue_users) ? raw.overdue_users.length : null) ??
    summary.overdue ?? 0

  return { summary: { totalBooks, totalMembers, activeBorrows, totalBorrows }, genreStats, topBooks, monthlyActivity, overdueCount }
}

// ── Custom donut centre label ─────────────────────────────────────────────────
function DonutLabel({ cx, cy, total }) {
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#1a2b40"
        style={{ fontSize: 26, fontWeight: 700, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#9ca3af"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        BOOKS
      </text>
    </g>
  )
}

// ── Custom Tooltip for genre pie ──────────────────────────────────────────────
function GenreTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { genre, count } = payload[0].payload
  return (
    <div style={{ background: '#1a2b40', borderRadius: 10, padding: '8px 14px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <p style={{ color: '#C8993A', fontWeight: 700, fontSize: 12, margin: 0 }}>{genre}</p>
      <p style={{ color: '#fff', fontSize: 11, margin: 0 }}>{count} book{count !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyChart({ message }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.35, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <BookOpen size={36} color="#1a2b40" />
      <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{message}</p>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [raw, setRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const r = await api.get('/admin/analytics')
      console.log('[QALAM Analytics] raw response:', r.data)
      setRaw(r.data)
      setError(null)
    } catch (e) {
      console.error('[QALAM Analytics] fetch error:', e)
      setError('Could not load analytics. Check your connection.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Loader2 size={36} color="#C8993A" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Loading analytics…</p>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <AlertTriangle size={36} color="#ef4444" />
      <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 700 }}>{error}</p>
      <button onClick={() => fetchData()}
        style={{ background: '#1a2b40', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
        Retry
      </button>
    </div>
  )

  const { genreStats, topBooks, monthlyActivity } = extractData(raw)
  const totalGenreBooks = genreStats.reduce((s, g) => s + g.count, 0)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 40px', display: 'flex', flexDirection: 'column', gap: 28, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header Container */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={28} color="#C8993A" />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a2b40', margin: 0 }}>
            Analytics
          </h1>
        </div>
        <button onClick={() => fetchData(true)} disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc',
            border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 16px',
            cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Monthly Activity Line Chart */}
      {monthlyActivity.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '28px 28px 20px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a2b40', marginBottom: 20 }}>Monthly Borrow Activity</h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyActivity} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600, fontFamily: 'system-ui, -apple-system, sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600, fontFamily: 'system-ui, -apple-system, sans-serif' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12, fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  formatter={(v) => [v, 'Borrows']}
                />
                <Line type="monotone" dataKey="borrows" stroke="#C8993A" strokeWidth={3}
                  isAnimationActive={true}
                  dot={{ r: 5, fill: '#C8993A', strokeWidth: 0 }}
                  activeDot={{ r: 7, fill: '#1a2b40' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Genre Pie + Top Books side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ── Genre Donut ── */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '28px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2b40', marginBottom: 4 }}>Books by Genre</h2>
          <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: 1.5,
            textTransform: 'uppercase', marginBottom: 20 }}>
            {genreStats.length} categories · {totalGenreBooks} total
          </p>

          {genreStats.length === 0
            ? <div style={{ height: 320 }}><EmptyChart message="No genre data available" /></div>
            : (
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreStats}
                      cx="50%"
                      cy="45%"
                      innerRadius={75}
                      outerRadius={115}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="genre"
                      stroke="none"
                      isAnimationActive={true}
                      animationDuration={800}
                    >
                      {genreStats.map((entry, i) => (
                        <Cell key={`cell-${i}-${entry.genre}`} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                      ))}
                    </Pie>
                    <g>
                      <DonutLabel cx="50%" cy="45%" total={totalGenreBooks} />
                    </g>
                    <Tooltip content={<GenreTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#475569',
                          textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                          {value}
                        </span>
                      )}
                      wrapperStyle={{ paddingTop: 16 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )
          }
        </div>

        {/* ── Most Borrowed Books ── */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '28px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2b40', marginBottom: 4 }}>Most Borrowed Books</h2>
          <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: 1.5,
            textTransform: 'uppercase', marginBottom: 20 }}>Top titles by borrow count</p>

          {topBooks.length === 0
            ? <div style={{ height: 320 }}><EmptyChart message="No borrow data yet" /></div>
            : (
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topBooks} layout="vertical"
                    margin={{ left: 4, right: 24, top: 4, bottom: 4 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="title"
                      type="category"
                      width={130}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b', fontFamily: 'system-ui, -apple-system, sans-serif' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12, fontFamily: 'system-ui, -apple-system, sans-serif' }}
                      formatter={(v) => [v, 'Borrows']}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="borrow_count" radius={[0, 8, 8, 0]} barSize={20} isAnimationActive={true}>
                      {topBooks.map((entry, i) => (
                        <Cell key={`bar-cell-${i}-${entry.title}`} fill={i === 0 ? '#C8993A' : i === 1 ? '#d4a843' : '#1a2b40'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          }
        </div>
      </div>

      {/* Genre breakdown table */}
      {genreStats.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '28px 28px 20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2b40', marginBottom: 20 }}>Genre Breakdown</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[...genreStats].sort((a, b) => b.count - a.count).map((g, i) => {
              const pct = totalGenreBooks > 0 ? Math.round((g.count / totalGenreBooks) * 100) : 0
              const color = GENRE_COLORS[i % GENRE_COLORS.length]
              return (
                <div key={g.genre} style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 12, background: '#f8fafc',
                  border: '1px solid #f1f5f9' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#1a2b40', margin: 0,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {g.genre}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#e2e8f0', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
                        {g.count}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}