import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EyeIcon, EyeOffIcon, SpinnerIcon, PenNib, CheckIcon } from '../components/shared/Icons'
import toast from 'react-hot-toast'

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

export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const newErrors = {}
    
    // Name Validation
    if (form.name && form.name.length < 3) newErrors.name = "Name too short"
    
    // Email Validation
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email format"
    
    // Password Validation
    if (form.password && form.password.length < 8) newErrors.password = "Minimum 8 characters"
    
    // Phone Validation (Optional but must be valid if entered)
    if (form.phone && !/^\+?[0-9\s-]{7,15}$/.test(form.phone)) {
      newErrors.phone = "Invalid phone number"
    }
    
    setErrors(newErrors)
  }, [form])

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password || Object.keys(errors).length > 0) {
      toast.error("Please fix the errors in the form")
      return
    }

    setLoading(true)
    try {
      await register(form)
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
       <div className="w-full max-w-md bg-[#FDFBF7] rounded-r-3xl rounded-l-lg p-10 text-center shadow-2xl border-l-[12px] border-[#0E1C2F]">
          <CheckIcon size={50} color="#22c55e" className="mx-auto mb-4"/>
          <h2 className="text-2xl font-bold text-[#0E1C2F]">Request Sent!</h2>
          <p className="text-[#0E1C2F]/60 mt-2 mb-6">Your account is pending admin approval.</p>
          <Link to="/login" className="block w-full py-3 bg-[#0E1C2F] text-[#CC993A] rounded-xl font-bold">Back to Login</Link>
       </div>
    </div>
  )

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{ 
          backgroundImage: `linear-gradient(rgba(14, 28, 47, 0.90), rgba(14, 28, 47, 0.95)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 w-full max-w-[460px] animate-in fade-in zoom-in-95 duration-500">
        <div className="relative bg-[#FDFBF7] rounded-r-[2.5rem] rounded-l-lg shadow-[25px_25px_60px_rgba(0,0,0,0.5)] overflow-hidden border-l-[14px] border-[#CC993A]">
          <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />

          <div className="p-8 md:p-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-[#0E1C2F] italic font-serif tracking-tight">Register</h2>
              <div className="h-0.5 w-10 bg-[#CC993A] mx-auto mt-1"></div>
              <p className="text-[9px] uppercase tracking-[3px] text-[#0E1C2F]/40 font-bold mt-3">New Archivist Entry</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Full Name</label>
                  {errors.name && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.name}</span>}
                </div>
                <input 
                  className={`w-full px-4 py-3 bg-black/[0.03] border ${errors.name ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`}
                  placeholder="Jane Doe" value={form.name} onChange={set('name')}
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Email Address</label>
                  {errors.email && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.email}</span>}
                </div>
                <input 
                  className={`w-full px-4 py-3 bg-black/[0.03] border ${errors.email ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`}
                  type="email" placeholder="archivist@gmail.com" value={form.email} onChange={set('email')}
                />
              </div>

              {/* Password */}
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
                    className={`w-full px-4 py-3 bg-black/[0.03] border ${errors.password ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`}
                    type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0E1C2F]/30">
                    {showPw ? <EyeOffIcon size={16}/> : <EyeIcon size={16}/>}
                  </button>
                </div>
                {form.password && (
                   <div className="flex gap-1 mt-1.5 px-1">
                     {[1,2,3,4].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500" 
                             style={{ background: i <= strengthLevel(form.password) ? strengthColor(strengthLevel(form.password)) : '#e5e7eb' }} />
                     ))}
                   </div>
                )}
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">
                    Contact Number <span className="lowercase opacity-60 font-normal">(optional)</span>
                  </label>
                  {errors.phone && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.phone}</span>}
                </div>
                <input 
                  className={`w-full px-4 py-3 bg-black/[0.03] border ${errors.phone ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`}
                  placeholder="+92..." value={form.phone} onChange={set('phone')}
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#0E1C2F] text-[#CC993A] rounded-xl font-black text-base shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2"
              >
                {loading ? <SpinnerIcon className="animate-spin" size={18}/> : <PenNib size={16}/>}
                {loading ? 'Processing...' : 'Register as Archivist'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-[#0E1C2F]/60">
                Already part of the community? <Link to="/login" className="text-[#0E1C2F] font-black border-b-2 border-[#CC993A]">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}