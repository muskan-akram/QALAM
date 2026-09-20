import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import AdminDashboard  from './pages/AdminDashboard'
import UserDashboard   from './pages/UserDashboard'
import BooksPage       from './pages/BooksPage'
import BookDetailPage  from './pages/BookDetailPage'
import TransactionsPage from './pages/TransactionsPage'
import UsersPage       from './pages/UsersPage'
import AnalyticsPage   from './pages/AnalyticsPage'
import ChatbotPage     from './pages/ChatbotPage'
import ProfilePage     from './pages/ProfilePage'
import NotFoundPage    from './pages/NotFoundPage'

// Layouts
import AdminLayout from './components/shared/AdminLayout'
import UserLayout  from './components/shared/UserLayout'

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full"/></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={!user ? <LoginPage />    : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />

      {/* Admin routes */}
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminLayout /></PrivateRoute>}>
        <Route index                element={<AdminDashboard />} />
        <Route path="books"         element={<BooksPage />} />
        <Route path="books/:id"     element={<BookDetailPage />} />
        <Route path="transactions"  element={<TransactionsPage />} />
        <Route path="users"         element={<UsersPage />} />
        <Route path="analytics"     element={<AnalyticsPage />} />
        <Route path="profile"       element={<ProfilePage />} />
      </Route>

      {/* User routes */}
      <Route path="/dashboard" element={<PrivateRoute><UserLayout /></PrivateRoute>}>
        <Route index              element={<UserDashboard />} />
        <Route path="books"       element={<BooksPage />} />
        <Route path="books/:id"   element={<BookDetailPage />} />
        <Route path="history"     element={<TransactionsPage />} />
        <Route path="chatbot"     element={<ChatbotPage />} />
        <Route path="profile"     element={<ProfilePage />} />
      </Route>

      {/* Redirects */}
      <Route path="/"  element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
      <Route path="*"  element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
