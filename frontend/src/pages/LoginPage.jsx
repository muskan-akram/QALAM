import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EyeIcon, EyeOffIcon, SpinnerIcon, PenNib } from '../components/shared/Icons'
import toast from 'react-hot-toast'

// Password Strength Logic (Same as Register Page)
const strengthLevel = pw => {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

const strengthText = s => (['', 'Weak', 'Fair', 'Good', 'Strong'])[s] || ''
const strengthColor = s => (['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'])[s] || ''

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Inline Validation & Strength Monitoring
  useEffect(() => {
    const newErrors = {}
    
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format"
    }
    
    if (form.password && form.password.length < 8) {
      newErrors.password = "Minimum 8 characters"
    }
    
    setErrors(newErrors)
  }, [form])

  const handleSubmit = async ev => {
    ev.preventDefault()
    
    if (!form.email || !form.password || Object.keys(errors).length > 0) {
      setErrors({
        email: !form.email ? "Email is required" : errors.email,
        password: !form.password ? "Password is required" : errors.password
      })
      toast.error("Please provide valid credentials")
      return
    }

    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}`)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-display">
      
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0 transition-transform duration-1000"
        style={{ 
          backgroundImage: `linear-gradient(rgba(14, 28, 47, 0.70), rgba(14, 28, 47, 0.9)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2000')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Main Hero Content */}
      <div className={`relative z-10 text-center px-6 transition-all duration-700 ${isModalOpen ? 'blur-lg scale-90 opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="mb-8 flex flex-col items-center">
             <div className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #CC993A 0%, #b88a34 100%)' }}>
               <PenNib size={40} color="#fff"/>
             </div>
             <p className="font-urdu text-4xl mb-2 text-[#CC993A]">قلم</p>
             <h1 className="text-6xl font-black text-white tracking-tight uppercase">QALAM</h1>
             <p className="mt-4 text-xl text-white/60 max-w-lg mx-auto leading-relaxed">
               QR Based <span className="text-[#CC993A]">AI-Integrated</span> Library Management System.
             </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative px-10 py-4 bg-transparent border-2 border-[#CC993A] rounded-full overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(204,153,58,0.4)]"
        >
          <span className="relative z-10 text-[#CC993A] font-bold text-lg group-hover:text-[#0E1C2F] transition-colors">ENTER in Library</span>
          <div className="absolute inset-0 bg-[#CC993A] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>

      {/* MODAL: Sign In */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="relative w-full max-w-[500px] bg-[#FDFBF7] rounded-r-[2.5rem] rounded-l-lg shadow-[25px_25px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in slide-in-from-bottom-10 duration-500 border-l-[14px] border-[#CC993A]">
            
            <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />

            <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute top-6 right-8 text-[#0E1C2F]/30 hover:text-[#0E1C2F] text-2xl transition-colors"
            >✕</button>

            <div className="p-10 md:p-12">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-[#0E1C2F] italic font-serif tracking-tight">Sign In</h2>
                    <div className="h-0.5 w-12 bg-[#CC993A] mx-auto mt-2"></div>
                    <p className="text-[10px] uppercase tracking-[3px] text-[#0E1C2F]/40 font-bold mt-4">Authorized Access Only</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Email Field */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Archive Email</label>
                      {errors.email && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.email}</span>}
                    </div>
                    <input
                      className={`w-full px-5 py-4 bg-black/[0.03] border ${errors.email ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all`}
                      type="email" placeholder="name@gmail.com"
                      value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                    />
                  </div>

                  {/* Password Field with Strength Indicator */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Secret Key</label>
                        {form.password && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/5" 
                                style={{ color: strengthColor(strengthLevel(form.password)) }}>
                            {strengthText(strengthLevel(form.password))}
                          </span>
                        )}
                      </div>
                      {errors.password && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.password}</span>}
                    </div>
                    <div className="relative">
                      <input
                        className={`w-full px-5 py-4 bg-black/[0.03] border ${errors.password ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all`}
                        type={showPw ? 'text' : 'password'} placeholder="••••••••"
                        value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPw(!showPw)} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0E1C2F]/30 hover:text-[#0E1C2F]"
                      >
                        {showPw ? <EyeOffIcon size={18}/> : <EyeIcon size={18}/>}
                      </button>
                    </div>

                    {/* Strength Bars (Green segments) */}
                    {form.password && (
                      <div className="flex gap-1 mt-2 px-1">
                        {[1, 2, 3, 4].map(i => (
                          <div 
                            key={i} 
                            className="h-1 flex-1 rounded-full transition-all duration-500" 
                            style={{ 
                              background: i <= strengthLevel(form.password) 
                                ? strengthColor(strengthLevel(form.password)) 
                                : '#e5e7eb' 
                            }} 
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-4 bg-[#0E1C2F] text-[#CC993A] rounded-xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <SpinnerIcon size={20} className="animate-spin" /> : <PenNib size={18}/>}
                    {loading ? 'Consulting Archive...' : 'Open Library'}
                  </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-sm text-[#0E1C2F]/60">
                      Not yet an archivist? <Link to="/register" className="text-[#0E1C2F] font-black border-b-2 border-[#CC993A] hover:bg-[#CC993A]/10 transition-colors">Join Qalam</Link>
                    </p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}