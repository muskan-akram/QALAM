import { useState, useEffect } from 'react'
import { X, Loader2, Upload } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const GENRES = ['Technology', 'Science Fiction', 'Self-Help', 'Non-Fiction', 'Fiction', 'History', 'Biography', 'Science', 'Philosophy']

export default function AddBookModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', publisher: '', published_year: '',
    genre: '', tags: '', description: '', total_copies: 1, location: '', language: 'English', pages: ''
  })
  const [cover, setCover] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Strict handling for input changes
  const handleInputChange = k => e => {
    let val = e.target.value

    // Restrict ISBN field to only numbers
    if (k === 'isbn') {
      val = val.replace(/[^0-9]/g, '')
    }

    setForm(p => ({ ...p, [k]: val }))
    if (!touched[k]) setTouched(p => ({ ...p, [k]: true }))
  }

  // Pure Registration-Style Dynamic Custom Validations
  useEffect(() => {
    const newErrors = {}

    // Title Minimum 3 Characters Check
    if (touched.title && (!form.title || form.title.trim().length < 3)) {
      newErrors.title = "Minimum 3 letters required"
    }

    // Author Minimum 3 Characters Check
    if (touched.author && (!form.author || form.author.trim().length < 3)) {
      newErrors.author = "Minimum 3 letters required"
    }

    // Publisher Minimum 3 Characters Check (Only if user has typed something)
    if (touched.publisher && form.publisher && form.publisher.trim().length < 3) {
      newErrors.publisher = "Minimum 3 letters required"
    }

    // Shelf Location Minimum 3 Characters Check (Only if user has typed something)
    if (touched.location && form.location && form.location.trim().length < 3) {
      newErrors.location = "Minimum 3 letters required"
    }

    // Language Minimum 3 Characters Check
    if (touched.language && form.language && form.language.trim().length < 3) {
      newErrors.language = "Minimum 3 letters required"
    }

    // ISBN Format Check (Should match standard lengths if present)
    if (form.isbn && form.isbn.length !== 10 && form.isbn.length !== 13) {
      newErrors.isbn = "ISBN must be 10 or 13 digits"
    }

    // Published Year Bounds Validation
    if (form.published_year && (parseInt(form.published_year) < 1000 || parseInt(form.published_year) > 2026)) {
      newErrors.published_year = "Invalid year range"
    }

    // Total Copies Check
    if (form.total_copies !== '' && parseInt(form.total_copies) < 1) {
      newErrors.total_copies = "Minimum 1 copy required"
    }

    // Page Count Check
    if (form.pages && parseInt(form.pages) < 1) {
      newErrors.pages = "Invalid page number"
    }

    setErrors(newErrors)
  }, [form, touched])

  const handleSubmit = async e => {
    e.preventDefault()

    // Flag validation states on submit attempt
    setTouched({ title: true, author: true, publisher: true, location: true, language: true })

    if (!form.title.trim() || !form.author.trim() || Object.keys(errors).length > 0) {
      toast.error("Please fix the errors in the form")
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'tags') fd.append('tags', JSON.stringify(v.split(',').map(t => t.trim()).filter(Boolean)))
        else if (v !== '') fd.append(k, v)
      })
      if (cover) fd.append('cover', cover)
      
      await api.post('/books', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Book added successfully!')
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      {/* Dynamic Style Injection for a completely integrated custom internal scrollbar */}
      <style>{`
        .book-modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .book-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .book-modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(14, 28, 47, 0.15);
          border-radius: 99px;
        }
        .book-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: #CC993A;
        }
      `}</style>

      {/* Main Book-Shaped Container Frame */}
      <div className="bg-[#FDFBF7] rounded-r-[2.5rem] rounded-l-lg w-full max-w-2xl max-h-[85vh] flex flex-col border-l-[14px] border-[#CC993A] shadow-[25px_25px_60px_rgba(0,0,0,0.35)] overflow-hidden">
        
        {/* Sticky Header View */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#0E1C2F]/10 bg-[#FDFBF7] z-10 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-black text-[#0E1C2F] italic font-serif tracking-tight">Add New Book</h2>
            <div className="h-0.5 w-10 bg-[#CC993A] mt-1"></div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-[#0E1C2F]/40 hover:text-[#0E1C2F] hover:bg-black/5 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body Content Area */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 overflow-y-auto book-modal-scroll flex-1">
          
          {/* Cover image (Positioned at top) */}
          <div className="space-y-1">
            <div className="px-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Cover Image</label>
            </div>
            <label className="flex items-center gap-3 p-4 bg-black/[0.015] border-2 border-dashed border-[#0E1C2F]/10 rounded-xl cursor-pointer hover:border-[#CC993A] transition-all">
              <Upload className="w-4 h-4 text-[#0E1C2F]/40" />
              <span className="text-sm text-[#0E1C2F]/60 font-medium">
                {cover ? cover.name : 'Click to upload cover image (max 5MB)'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={e => setCover(e.target.files[0])} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="col-span-2 space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Title *</label>
                {errors.title && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.title}</span>}
              </div>
              <input 
                className={`w-full px-4 py-3 bg-black/[0.025] border ${errors.title ? 'border-red-400 focus:ring-red-400' : 'border-[#0E1C2F]/10 focus:ring-[#CC993A]'} rounded-xl focus:ring-1 outline-none text-[#0E1C2F] transition-all text-sm`} 
                value={form.title} 
                onChange={handleInputChange('title')} 
                placeholder="Book title" 
              />
            </div>

            {/* Author */}
            <div className="col-span-2 md:col-span-1 space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Author *</label>
                {errors.author && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.author}</span>}
              </div>
              <input 
                className={`w-full px-4 py-3 bg-black/[0.025] border ${errors.author ? 'border-red-400 focus:ring-red-400' : 'border-[#0E1C2F]/10 focus:ring-[#CC993A]'} rounded-xl focus:ring-1 outline-none text-[#0E1C2F] transition-all text-sm`} 
                value={form.author} 
                onChange={handleInputChange('author')} 
                placeholder="Author name" 
              />
            </div>

            {/* ISBN (Strictly Numeric) */}
            <div className="col-span-2 md:col-span-1 space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">ISBN</label>
                {errors.isbn && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.isbn}</span>}
              </div>
              <input 
                className={`w-full px-4 py-3 bg-black/[0.025] border ${errors.isbn ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`} 
                value={form.isbn} 
                onChange={handleInputChange('isbn')} 
                placeholder="Numbers only" 
              />
            </div>

            {/* Publisher */}
            <div className="col-span-2 md:col-span-1 space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Publisher</label>
                {errors.publisher && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.publisher}</span>}
              </div>
              <input 
                className={`w-full px-4 py-3 bg-black/[0.025] border ${errors.publisher ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`} 
                value={form.publisher} 
                onChange={handleInputChange('publisher')} 
              />
            </div>

            {/* Published Year */}
            <div className="col-span-2 md:col-span-1 space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Published Year</label>
                {errors.published_year && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.published_year}</span>}
              </div>
              <input 
                className={`w-full px-4 py-3 bg-black/[0.025] border ${errors.published_year ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`} 
                type="number" 
                value={form.published_year} 
                onChange={handleInputChange('published_year')} 
                placeholder="2025" 
              />
            </div>

            {/* Genre */}
            <div className="col-span-2 md:col-span-1 space-y-1">
              <div className="px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Genre</label>
              </div>
              <select 
                className="w-full px-4 py-3 bg-black/[0.025] border border-[#0E1C2F]/10 rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm appearance-none" 
                value={form.genre} 
                onChange={handleInputChange('genre')}
              >
                <option value="">Select genre</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Total Copies */}
            <div className="col-span-2 md:col-span-1 space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Total Copies *</label>
                {errors.total_copies && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.total_copies}</span>}
              </div>
              <input 
                className={`w-full px-4 py-3 bg-black/[0.025] border ${errors.total_copies ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`} 
                type="number" 
                value={form.total_copies} 
                onChange={handleInputChange('total_copies')} 
              />
            </div>

            {/* Shelf Location */}
            <div className="col-span-2 md:col-span-1 space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Shelf Location</label>
                {errors.location && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.location}</span>}
              </div>
              <input 
                className={`w-full px-4 py-3 bg-black/[0.025] border ${errors.location ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`} 
                value={form.location} 
                onChange={handleInputChange('location')} 
                placeholder="e.g. A-01" 
              />
            </div>

            {/* Language */}
            <div className="col-span-2 md:col-span-1 space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Language</label>
                {errors.language && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.language}</span>}
              </div>
              <input 
                className={`w-full px-4 py-3 bg-black/[0.025] border ${errors.language ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`} 
                value={form.language} 
                onChange={handleInputChange('language')} 
              />
            </div>

            {/* Pages */}
            <div className="col-span-2 space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Pages</label>
                {errors.pages && <span className="text-[10px] font-bold text-red-500 animate-pulse">{errors.pages}</span>}
              </div>
              <input 
                className={`w-full px-4 py-3 bg-black/[0.025] border ${errors.pages ? 'border-red-400' : 'border-[#0E1C2F]/10'} rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm`} 
                type="number" 
                value={form.pages} 
                onChange={handleInputChange('pages')} 
              />
            </div>

            {/* Tags */}
            <div className="col-span-2 space-y-1">
              <div className="px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Tags (comma-separated)</label>
              </div>
              <input 
                className="w-full px-4 py-3 bg-black/[0.025] border border-[#0E1C2F]/10 rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm" 
                value={form.tags} 
                onChange={handleInputChange('tags')} 
                placeholder="python, programming, beginner" 
              />
            </div>

            {/* Description */}
            <div className="col-span-2 space-y-1">
              <div className="px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E1C2F]/50">Description</label>
              </div>
              <textarea 
                className="w-full px-4 py-3 bg-black/[0.025] border border-[#0E1C2F]/10 rounded-xl focus:ring-1 focus:ring-[#CC993A] outline-none text-[#0E1C2F] transition-all text-sm h-24 resize-none" 
                value={form.description} 
                onChange={handleInputChange('description')} 
              />
            </div>
          </div>

          {/* Action Action Controls Footing Bar Area */}
          <div className="flex gap-4 pt-4 border-t border-[#0E1C2F]/10 sticky bottom-0 bg-[#FDFBF7] z-10">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3.5 bg-black/[0.05] text-[#0E1C2F]/70 hover:bg-black/[0.08] font-bold rounded-xl transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || Object.keys(errors).length > 0} 
              className="flex-1 py-3.5 bg-[#0E1C2F] text-[#CC993A] rounded-xl font-black text-base shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-3"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>{loading ? 'Adding…' : 'Add Book & Generate QR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}