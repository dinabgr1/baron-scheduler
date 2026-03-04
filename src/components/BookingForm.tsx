'use client'

import { useState, useEffect, useRef } from 'react'

type Pilot = { id: string; name: string; phone: string | null; license_number: string | null; is_active?: boolean }
type ExistingBooking = { id: string; pilot_name: string; date: string; start_time: string; end_time: string; status: string }

export default function BookingForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    pilot_name: '',
    phone: '',
    date: '',
    start_time: '',
    end_time: '',
    with_instructor: false,
    instructor_name: 'Shani Segev',
    flight_purpose: 'אימון',
  })
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [newPilotFields, setNewPilotFields] = useState({ license_number: '', new_name: '' })
  const [pilotStatus, setPilotStatus] = useState<'idle' | 'checking' | 'found' | 'new'>('idle')
  const [pilotSearch, setPilotSearch] = useState<string | null>(null)
  const [showPilotDropdown, setShowPilotDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPilotDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [dayBookings, setDayBookings] = useState<ExistingBooking[]>([])
  const [conflict, setConflict] = useState<ExistingBooking | null>(null)
  const [loadingDay, setLoadingDay] = useState(false)

  useEffect(() => {
    if (!form.date) { setDayBookings([]); setConflict(null); return }
    setLoadingDay(true)
    fetch(`/api/bookings?from=${form.date}&to=${form.date}`)
      .then(r => r.json())
      .then((bookings: ExistingBooking[]) => {
        const active = bookings.filter(b => b.status === 'approved' || b.status === 'pending')
        setDayBookings(active)
      })
      .catch(() => setDayBookings([]))
      .finally(() => setLoadingDay(false))
  }, [form.date])

  useEffect(() => {
    if (!form.start_time || !form.end_time || dayBookings.length === 0) {
      setConflict(null); return
    }
    const found = dayBookings.find(b =>
      form.start_time < b.end_time && form.end_time > b.start_time
    )
    setConflict(found || null)
  }, [form.start_time, form.end_time, dayBookings])

  // Load pilots on mount
  useEffect(() => {
    fetch('/api/pilots').then(r => r.json()).then((data: Pilot[]) => {
      setPilots(Array.isArray(data) ? data.filter(p => p.is_active !== false) : [])
    }).catch(() => setPilots([]))
  }, [])

  // Check pilot status when name changes
  useEffect(() => {
    const name = form.pilot_name.trim()
    if (name === '__new__') { setPilotStatus('new'); return }
    if (name.length < 2) { setPilotStatus('idle'); return }
    if (checkTimer.current) clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(() => {
      const found = pilots.find(p => p.name.trim().toLowerCase() === name.toLowerCase())
      if (found) {
        setPilotStatus('found')
        if (!form.phone && found.phone) setForm(f => ({ ...f, phone: found.phone! }))
      } else {
        setPilotStatus('new')
      }
    }, 300)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pilot_name, pilots])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (conflict) {
      if (!confirm(`⚠️ יש התנגשות עם הזמנה של ${conflict.pilot_name} (${conflict.start_time}–${conflict.end_time}). להמשיך בכל זאת?`)) return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      const actualPilotName = form.pilot_name === '__new__' ? newPilotFields.new_name.trim() : form.pilot_name.trim()
      if (!actualPilotName) {
        throw new Error('יש להזין שם טייס')
      }
      if (pilotStatus === 'new') {
        const pilotRes = await fetch('/api/pilots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: actualPilotName,
            phone: form.phone,
            license_number: newPilotFields.license_number || null,
          }),
        })
        if (!pilotRes.ok) {
          const err = await pilotRes.json()
          throw new Error(err.error || 'שגיאה ביצירת טייס חדש')
        }
      }
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pilot_name: actualPilotName }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create booking')
      }
      setMessage({ type: 'success', text: 'ההזמנה נשלחה בהצלחה! ממתין לאישור.' })
      setForm({ pilot_name: '', phone: '', date: '', start_time: '', end_time: '', with_instructor: false, instructor_name: 'Shani Segev', flight_purpose: 'אימון' })
      setNewPilotFields({ license_number: '', new_name: '' })
      setPilotStatus('idle')
      setDayBookings([])
      setConflict(null)
      onSuccess?.()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'שגיאה ביצירת ההזמנה' })
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const inputClass = "w-full px-4 py-3 rounded-xl bg-white border border-baron-border text-baron-text placeholder-baron-muted focus:outline-none focus:border-baron-gold focus:ring-2 focus:ring-baron-gold/20 text-[14px]"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-baron-muted text-[11px] font-medium uppercase tracking-[0.1em] block mb-1.5">שם הטייס</label>
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <input
              type="text"
              required
              value={form.pilot_name === '__new__' ? '' : pilotSearch ?? form.pilot_name}
              onChange={(e) => {
                const val = e.target.value
                setPilotSearch(val)
                // Only show dropdown when user is actively typing (2+ chars)
                if (val.length >= 2) {
                  setShowPilotDropdown(true)
                } else {
                  setShowPilotDropdown(false)
                }
                if (!val) {
                  setForm({ ...form, pilot_name: '', phone: '' })
                  setPilotStatus('idle')
                }
              }}
              placeholder="הקלד שם טייס..."
              className={inputClass}
              autoComplete="off"
            />
            {pilotStatus === 'found' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">✓</span>}
          </div>
          {showPilotDropdown && pilotSearch && pilotSearch.length >= 2 && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-baron-border shadow-lg max-h-48 overflow-y-auto">
              {(() => {
                const filtered = pilots.filter(p => p.name.toLowerCase().includes(pilotSearch.toLowerCase()))
                if (filtered.length > 0) {
                  return filtered.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, pilot_name: p.name, phone: p.phone || '' })
                        setPilotStatus('found')
                        setPilotSearch(null)
                        setShowPilotDropdown(false)
                      }}
                      className="w-full text-right px-4 py-2.5 text-[13px] text-baron-text hover:bg-baron-bg transition-colors border-b border-baron-border/50 last:border-0"
                    >
                      {p.name}
                    </button>
                  ))
                } else {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, pilot_name: '__new__', phone: '' })
                        setPilotStatus('new')
                        setPilotSearch(null)
                        setShowPilotDropdown(false)
                      }}
                      className="w-full text-right px-4 py-2.5 text-[13px] text-baron-gold-text font-medium hover:bg-baron-gold/5 transition-colors"
                    >
                      ➕ הוסף את &quot;{pilotSearch}&quot; כטייס חדש
                    </button>
                  )
                }
              })()}
            </div>
          )}
          {pilotStatus === 'found' && <p className="text-emerald-500 text-[11px] mt-1 font-medium">✓ טייס קיים במערכת</p>}
        </div>
      </div>

      {pilotStatus === 'new' && (
        <div className="bg-baron-gold/5 border border-baron-gold/20 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-xl">👋</span>
            <div>
              <p className="text-baron-text font-semibold text-[13px]">טייס חדש!</p>
              <p className="text-baron-muted text-[11px]">מלא פרטים כדי להירשם למערכת.</p>
            </div>
          </div>
          {form.pilot_name === '__new__' && (
            <div>
              <label className="text-baron-gold-text text-[11px] font-semibold mb-1 block">שם מלא</label>
              <input type="text" required value={newPilotFields.new_name || ''}
                onChange={e => setNewPilotFields({ ...newPilotFields, new_name: e.target.value })}
                placeholder="הכנס שם מלא"
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-baron-gold/30 text-baron-text placeholder-baron-muted focus:outline-none focus:border-baron-gold text-[13px]" />
            </div>
          )}
          <div>
            <label className="text-baron-gold-text text-[11px] font-semibold mb-1 block">מספר רישיון טיס</label>
            <input type="text" value={newPilotFields.license_number}
              onChange={e => setNewPilotFields({ ...newPilotFields, license_number: e.target.value })}
              placeholder="לדוגמה: IL-PPL-12345"
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-baron-gold/30 text-baron-text placeholder-baron-muted focus:outline-none focus:border-baron-gold text-[13px]" />
          </div>
        </div>
      )}

      <div>
        <label className="text-baron-muted text-[11px] font-medium uppercase tracking-[0.1em] block mb-1.5">טלפון</label>
        {pilotStatus === 'found' && form.phone ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15 text-baron-text">
            <span className="text-emerald-500">📱</span>
            <span className="flex-1 text-[14px]">{form.phone}</span>
            <button type="button" onClick={() => setPilotStatus('idle')}
              className="text-[11px] text-baron-muted hover:text-baron-text underline">שנה</button>
          </div>
        ) : (
          <input type="tel" required value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="050-0000000" className={inputClass} />
        )}
      </div>

      <div>
        <label className="text-baron-muted text-[11px] font-medium uppercase tracking-[0.1em] block mb-1.5">מטרת הטיסה</label>
        <select value={form.flight_purpose}
          onChange={(e) => setForm({ ...form, flight_purpose: e.target.value })}
          className={inputClass}>
          <option value="אימון">אימון</option>
          <option value="טיסה פרטית">טיסה פרטית</option>
          <option value="טיסה עצמאית">טיסה עצמאית</option>
          <option value="אחר">אחר</option>
        </select>
      </div>

      <div>
        <label className="text-baron-muted text-[11px] font-medium uppercase tracking-[0.1em] block mb-1.5">תאריך</label>
        <input type="date" required min={today} value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className={inputClass} />
        {loadingDay && <p className="text-[11px] text-baron-muted mt-1">בודק זמינות...</p>}
        {!loadingDay && form.date && dayBookings.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-[11px] font-medium text-baron-muted">הזמנות קיימות ביום זה:</p>
            {dayBookings.map(b => (
              <div key={b.id} className="flex items-center gap-2 text-[11px] bg-baron-bg rounded-lg px-3 py-1.5 border border-baron-border">
                <span className={`w-[5px] h-[5px] rounded-full ${b.status === 'approved' ? 'bg-emerald-400' : 'bg-baron-red'}`} />
                <span className="font-mono font-medium text-baron-text">{b.start_time}–{b.end_time}</span>
                <span className="text-baron-muted">{b.pilot_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-baron-muted text-[11px] font-medium uppercase tracking-[0.1em] block mb-1.5">שעת התחלה</label>
          <input type="time" required value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            className={`${inputClass} ${conflict ? 'border-baron-red bg-baron-red/5' : ''}`} />
        </div>
        <div>
          <label className="text-baron-muted text-[11px] font-medium uppercase tracking-[0.1em] block mb-1.5">שעת סיום</label>
          <input type="time" required value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            className={`${inputClass} ${conflict ? 'border-baron-red bg-baron-red/5' : ''}`} />
        </div>
      </div>

      {conflict && (
        <div className="bg-baron-red/5 border border-baron-red/20 rounded-xl p-3 flex items-start gap-2">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-baron-red font-semibold text-[13px]">התנגשות!</p>
            <p className="text-baron-red/70 text-[11px]">
              המטוס תפוס ע&quot;י {conflict.pilot_name} בשעות {conflict.start_time}–{conflict.end_time}
              {conflict.status === 'pending' && ' (ממתין לאישור)'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-baron-bg border border-baron-border">
          <input type="checkbox" checked={form.with_instructor}
            onChange={(e) => setForm({ ...form, with_instructor: e.target.checked })}
            className="w-5 h-5 rounded border-baron-border text-baron-gold focus:ring-baron-gold/40" />
          <span className="text-baron-text text-[14px] font-medium">טיסה עם מדריך</span>
        </label>
        {form.with_instructor && (
          <select value={form.instructor_name}
            onChange={(e) => setForm({ ...form, instructor_name: e.target.value })}
            className={inputClass}>
            <option value="Shani Segev">שני שגיב</option>
          </select>
        )}
      </div>

      <button type="submit" disabled={submitting || pilotStatus === 'checking'}
        className={`w-full py-4 rounded-xl font-bold text-[15px] transition-all ${
          conflict
            ? 'bg-orange-500 hover:bg-orange-600 text-white'
            : 'gold-bg text-baron-text hover:brightness-110'
        } disabled:bg-baron-dim disabled:text-baron-muted disabled:cursor-not-allowed`}>
        {submitting ? 'שולח...' : conflict ? '⚠️ שלח בכל זאת' : pilotStatus === 'new' ? 'הירשם ושלח הזמנה' : 'שלח הזמנה ✈️'}
      </button>

      {message && (
        <div className={`p-4 rounded-xl text-center font-medium text-[13px] ${
          message.type === 'success' ? 'bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-600' : 'bg-baron-red/[0.06] border border-baron-red/15 text-baron-red'
        }`}>
          {message.text}
        </div>
      )}
    </form>
  )
}
