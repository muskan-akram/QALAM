import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NotFoundPage() {
  const { user } = useAuth()
  const home = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'
  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
      <div className="text-center animate-slide-up">
        <p className="text-8xl mb-4">📚</p>
        <h1 className="font-display text-4xl font-bold text-ink-900 mb-2">Page Not Found</h1>
        <p className="text-ink-500 mb-8">The page you're looking for doesn't exist in our catalogue.</p>
        <Link to={home} className="btn-primary">← Back to Home</Link>
      </div>
    </div>
  )
}
