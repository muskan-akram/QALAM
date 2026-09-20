import { useEffect, useState, useRef } from 'react'
import { Loader2, Save, Camera } from 'lucide-react'
import { EyeIcon, EyeOffIcon } from '../components/shared/Icons'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
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

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({}) 
  const [preview, setPreview] = useState(null) 
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  useEffect(() => {
    api.get('/users/profile').then(r => {
      const u = r.data.user
      setForm(p => ({ ...p, name: u.name || '', phone: u.phone || '', address: u.address || '' }))
      if (u.avatar_url) {
        setPreview(u.avatar_url)
      }
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const newErrors = {}

    if (form.name && form.name.length < 3) {
      newErrors.name = "Name too short"
    }

    if (form.password && form.password.length < 8) {
      newErrors.password = "Minimum 8 characters"
    }

    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (form.phone && !/^\+?[0-9\s-]{7,15}$/.test(form.phone)) {
      newErrors.phone = "Invalid phone number"
    }

    setErrors(newErrors)
  }, [form])

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
      toast.success('Picture selected! Click Save to update.')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    if (!form.name || Object.keys(errors).length > 0) {
      toast.error("Please fix the errors in the form")
      return
    }

    setSaving(true)
    try {
      const payload = { name: form.name, phone: form.phone, address: form.address }
      if (form.password) payload.password = form.password
      if (preview) payload.profile_picture = preview 

      await api.put('/users/profile', payload)
      toast.success('Profile updated successfully!')
      setForm(p => ({ ...p, password: '', confirmPassword: '' }))
      
      // Auto reload layout interface to force update sidebar & top bar mirrors
      setTimeout(() => {
        window.location.reload()
      }, 600)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-ink-300" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="text-ink-500 text-sm mt-1">Manage your account details</p>
      </div>

      {/* Avatar / info card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="relative group">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white text-2xl font-display font-bold flex-shrink-0 overflow-hidden">
            {preview ? (
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              authUser?.name?.[0]?.toUpperCase()
            )}
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="absolute -bottom-1 -right-1 bg-white border border-ink-200 p-1.5 rounded-lg shadow-sm hover:bg-ink-50"
          >
            <Camera className="w-3.5 h-3.5 text-ink-600" />
          </button>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
        </div>
        <div>
          <p className="font-display text-xl font-bold text-ink-900">{authUser?.name}</p>
          <p className="text-ink-500 text-sm">{authUser?.email}</p>
          <span className={`badge mt-1 ${authUser?.role === 'admin' ? 'badge-amber' : 'badge-blue'}`}>
            {authUser?.role}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <h2 className="section-title mb-5">Edit Details</h2>
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Full Name */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Full Name</label>
              {errors.name && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.name}</span>}
            </div>
            <input 
              className={`w-full px-4 py-3 bg-black/[0.03] border ${errors.name ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`} 
              value={form.name} 
              onChange={set('name')} 
              required 
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <div className="px-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Email Address</label>
            </div>
            <input className="w-full px-4 py-3 bg-ink-50 border border-[#0E1C2F]/10 rounded-xl cursor-not-allowed text-[#0E1C2F]/60 text-sm" value={authUser?.email} readOnly />
            <p className="text-[11px] text-ink-400 px-1">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Phone</label>
              {errors.phone && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.phone}</span>}
            </div>
            <input 
              className={`w-full px-4 py-3 bg-black/[0.03] border ${errors.phone ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`} 
              type="tel" 
              value={form.phone} 
              onChange={set('phone')} 
              placeholder="Optional" 
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <div className="px-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Address</label>
            </div>
            <textarea 
              className="w-full px-4 py-3 bg-black/[0.03] border border-[#0E1C2F]/10 rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm h-20 resize-none" 
              value={form.address} 
              onChange={set('address')} 
              placeholder="Optional" 
            />
          </div>

          {/* Password Settings */}
          <div className="pt-4 border-t border-ink-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700">Change Password (optional)</h3>
            
            {/* New Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">New Password</label>
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
                  type={showPw ? 'text' : 'password'} 
                  value={form.password} 
                  onChange={set('password')}
                  placeholder="Leave blank to keep current" 
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0E1C2F]/30">
                  {showPw ? <EyeOffIcon size={16}/> : <EyeIcon size={16}/>}
                </button>
              </div>
              {/* Strength Indicators */}
              {form.password && (
                 <div className="flex gap-1 mt-1.5 px-1">
                   {[1,2,3,4].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500" 
                           style={{ background: i <= strengthLevel(form.password) ? strengthColor(strengthLevel(form.password)) : '#e5e7eb' }} />
                   ))}
                 </div>
              )}
            </div>

            {/* Confirm Password */}
            {form.password && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Confirm Password</label>
                  {errors.confirmPassword && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.confirmPassword}</span>}
                </div>
                <div className="relative">
                  <input 
                    className={`w-full px-4 py-3 bg-black/[0.03] border ${errors.confirmPassword ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`} 
                    type={showConfirmPw ? 'text' : 'password'} 
                    value={form.confirmPassword} 
                    onChange={set('confirmPassword')} 
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0E1C2F]/30">
                    {showConfirmPw ? <EyeOffIcon size={16}/> : <EyeIcon size={16}/>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Save Button */}
          <button 
            type="submit" 
            disabled={saving || Object.keys(errors).length > 0} 
            className="w-full py-3.5 bg-[#0E1C2F] text-[#CC993A] rounded-xl font-black text-base shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 transition-all flex items-center justify-center gap-3 mt-6"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>{saving ? 'Updating Profile...' : 'Save Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}