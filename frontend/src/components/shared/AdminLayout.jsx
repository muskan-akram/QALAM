import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  GridIcon, BookStack, UserGroup, SwapIcon, ChartRise,
  UserIcon, LogOutIcon, BellIcon, MenuIcon, CloseIcon, PenNib, QRIcon
} from './Icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'

const NAV = [
  { to: '/admin',              icon: GridIcon,    label: 'Dashboard',     end: true },
  { to: '/admin/books',        icon: BookStack,   label: 'Books' },
  { to: '/admin/transactions', icon: SwapIcon,    label: 'Transactions' },
  { to: '/admin/users',        icon: UserGroup,   label: 'Members' },
  { to: '/admin/analytics',    icon: ChartRise,   label: 'Analytics' },
  { to: '/admin/profile',      icon: UserIcon,    label: 'My Profile' },
]

export default function AdminLayout() {
  const { user, logout }    = useAuth()
  const [sideOpen,  setSideOpen]  = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifs,    setNotifs]    = useState([])
  const [unread,    setUnread]    = useState(0)

  const fetchNotifs = () => {
    api.get('/notifications').then(r => {
      setNotifs(r.data.notifications || [])
      setUnread(r.data.unread || 0)
    }).catch(() => {})
  }

  useEffect(() => {
    fetchNotifs()
    // Poll every 60 s so badge stays fresh
    const id = setInterval(fetchNotifs, 60000)
    return () => clearInterval(id)
  }, [])

  // Mark single notification as read
  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {})
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  // Mark all as read
  const markAll = async () => {
    await api.patch('/notifications/read-all').catch(() => {})
    setUnread(0)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  // Delete single notification
  const deleteNotif = async (id) => {
    const wasUnread = notifs.find(n => n.id === id && !n.is_read)
    await api.delete(`/notifications/${id}`).catch(() => {})
    setNotifs(prev => prev.filter(n => n.id !== id))
    if (wasUnread) setUnread(prev => Math.max(0, prev - 1))
  }

  // Delete all notifications
  const deleteAll = async () => {
    if (!confirm('Clear all notifications?')) return
    await api.delete('/notifications').catch(() => {})
    setNotifs([])
    setUnread(0)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      {/* Overlay */}
      {sideOpen && (
        <div className="fixed inset-0 z-20 lg:hidden"
             style={{ background: 'rgba(14,28,47,.5)', backdropFilter: 'blur(4px)' }}
             onClick={() => setSideOpen(false)}/>
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-[240px] flex flex-col
                         transition-transform duration-300 lg:translate-x-0
                         ${sideOpen ? 'translate-x-0' : '-translate-x-full'}`}
             style={{ background: 'var(--c-navy)', borderRight: '1px solid rgba(255,255,255,.06)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5"
             style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,var(--c-gold) 0%,var(--c-gold-dk) 100%)' }}>
            <PenNib size={18} color="#fff"/>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-urdu text-xl leading-none" style={{ color: 'var(--c-gold-lt)' }}>قلم</span>
              <span className="font-display font-bold text-base" style={{ color: 'rgba(255,255,255,.9)' }}>QALAM</span>
            </div>
            <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,.3)' }}>
              Admin Portal
            </p>
          </div>
        </div>

        <p className="px-6 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[0.15em]"
           style={{ color: 'rgba(255,255,255,.25)' }}>Navigation</p>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setSideOpen(false)}
              className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}>
              <Icon size={17} color="currentColor"/>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Notification shortcut */}
        <div className="px-3 pb-2" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <button
            onClick={() => { setShowNotif(true); setSideOpen(false) }}
            className="nav-item w-full relative"
            style={{ marginTop: 8 }}>
            <BellIcon size={17} color="currentColor"/>
            Notifications
            {unread > 0 && (
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--c-mint)', color: '#fff' }}>
                {unread}
              </span>
            )}
          </button>
        </div>

        {/* User footer */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
               style={{ background: 'rgba(255,255,255,.05)' }}>
            


            <div className="px-3 pb-4">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,.05)' }}>
                
                {/* Dynamic Avatar Ring */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden border border-white/10"
                    style={{ background: user?.avatar_url ? 'transparent' : 'linear-gradient(135deg,var(--c-gold) 0%,var(--c-gold-dk) 100%)', color: '#fff' }}>
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback strategy if image base64/url string errors out
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = 'linear-gradient(135deg,var(--c-gold) 0%,var(--c-gold-dk) 100%)';
                      }}
                    />
                  ) : (
                    user?.name?.[0]?.toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,.9)' }}>{user?.name}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,.35)' }}>Administrator</p>
                </div>
                
                <button onClick={logout} className="p-1 rounded-lg transition-colors hover:bg-white/10"
                        style={{ color: 'rgba(255,255,255,.4)' }}>
                  <LogOutIcon size={14} color="currentColor"/>
                </button>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,.9)' }}>{user?.name}</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,.35)' }}>Administrator</p>
            </div>
            <button onClick={logout} className="p-1 rounded-lg transition-colors hover:bg-white/10"
                    style={{ color: 'rgba(255,255,255,.4)' }}>
              <LogOutIcon size={14} color="currentColor"/>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-5 lg:px-7 h-[60px] flex-shrink-0"
                style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', boxShadow: '0 1px 6px rgba(14,28,47,.05)' }}>
          <button className="lg:hidden p-2 rounded-xl hover:bg-cream-dark"
                  onClick={() => setSideOpen(p => !p)}>
            {sideOpen ? <CloseIcon size={20}/> : <MenuIcon size={20}/>}
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <PenNib size={16} color="var(--c-ink-muted)"/>
            <span className="text-sm font-medium" style={{ color: 'var(--c-ink-muted)' }}>
              QALAM Library Management System
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowNotif(p => !p)}
              className="relative p-2.5 rounded-xl transition-all hover:bg-cream-dark">
              <BellIcon size={18} color="var(--c-ink-soft)"/>
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--c-mint)', color: '#fff' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7 anim-fade">
          <Outlet />
        </main>
      </div>

      {/* ── NOTIFICATION PANEL ── */}
      {showNotif && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)}
               style={{ background: 'rgba(14,28,47,.25)', backdropFilter: 'blur(2px)' }}/>
          <div className="fixed right-0 top-0 bottom-0 z-50 w-[360px] flex flex-col anim-right"
               style={{ background: 'var(--c-surface)', boxShadow: '-8px 0 40px rgba(14,28,47,.15)', borderLeft: '1px solid var(--c-border)' }}>

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                 style={{ borderBottom: '1px solid var(--c-border)' }}>
              <div>
                <p className="font-display font-bold text-base" style={{ color: 'var(--c-ink)' }}>Notifications</p>
                {unread > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--c-ink-muted)' }}>{unread} unread</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={markAll}
                    className="text-xs font-semibold px-3 py-1 rounded-full transition-colors hover:bg-cream-dark"
                    style={{ color: 'var(--c-mint-dk)' }}>
                    Mark all read
                  </button>
                )}
                {notifs.length > 0 && (
                  <button onClick={deleteAll}
                    className="text-xs font-semibold px-3 py-1 rounded-full transition-colors hover:bg-red-50"
                    style={{ color: '#dc2626' }}>
                    Clear all
                  </button>
                )}
                <button onClick={() => setShowNotif(false)} className="p-2 rounded-xl hover:bg-cream-dark ml-1">
                  <CloseIcon size={16} color="var(--c-ink-soft)"/>
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {notifs.length === 0
                ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <BellIcon size={36} color="var(--c-border)"/>
                    <p className="text-sm" style={{ color: 'var(--c-ink-muted)' }}>No notifications yet</p>
                  </div>
                )
                : notifs.map(n => (
                  <div key={n.id}
                       className="group px-5 py-4 transition-colors hover:bg-cream-dark"
                       style={{ borderBottom: '1px solid var(--c-border)', background: n.is_read ? 'transparent' : 'rgba(0,184,159,.04)' }}>
                    <div className="flex items-start gap-3">

                      {/* Unread dot — click to mark read */}
                      <button
                        onClick={() => !n.is_read && markRead(n.id)}
                        title={n.is_read ? 'Read' : 'Click to mark read'}
                        className="mt-1.5 flex-shrink-0 w-2.5 h-2.5 rounded-full transition-all hover:scale-125"
                        style={{ background: n.is_read ? 'var(--c-border)' : 'var(--c-mint)', cursor: n.is_read ? 'default' : 'pointer' }}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>{n.title}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--c-ink-soft)' }}>{n.message}</p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--c-ink-muted)' }}>
                          {format(new Date(n.created_at), 'MMM d, h:mm a')}
                        </p>

                        {/* Inline actions — visible on hover */}
                        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.is_read && (
                            <button onClick={() => markRead(n.id)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors hover:bg-green-100"
                              style={{ color: '#059669', border: '1px solid rgba(5,150,105,.2)' }}>
                              Mark read
                            </button>
                          )}
                          <button onClick={() => deleteNotif(n.id)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors hover:bg-red-100"
                            style={{ color: '#dc2626', border: '1px solid rgba(220,38,38,.2)' }}>
                            <Trash2 size={9}/> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </>
      )}
    </div>
  )
}