'use client'

import { useState, useEffect, useRef } from 'react'

type Pilot = { id: string; name: string; phone: string | null; license_number: string | null }

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
  const [newPilotFields, setNewPilotFields] = useState({ license_number: '' })
  const [pilotStatus, setPilotStatus] = useState<'idle' | 'checking' | 'found' | 'new'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const name = form.pilot_name.trim()
    if (name.length < 2) { setPilotStatus('idle'); return }
    if (checkTimer.current) clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(async () => {
      setPilotStatus('checking')
      try {
        const res = await fetch('/api/pilots')
        const pilots: Pilot[] = await res.json()
        const found = pilots.find(p => p.name.trim().toLowerCase() === name.toLowerCase())
        if (found) {
          setPilotStatus('found')
          if (!form.phone && found.phone) setForm(f => ({ ...f, phone: found.phone! }))
        } else {
          setPilotStatus('new')
        }
      } catch {
        setPilotStatus('idle')
      }
    }, 600)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pilot_name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      if (pilotStatus === 'new') {
        const pilotRes = await fetch('/api/pilots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.pilot_name.trim(),
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
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create booking')
      }
      setMessage({ type: 'success', text: 'ההזמנה נשלחה בהצלחה! ממתין לאישור.' })
      setForm({ pilot_name: '', phone: '', date: '', start_time: '', end_time: '', with_instructor: false, instructor_name: 'Shani Segev', flight_purpose: 'אימון' })
      setNewPilotFields({ license_number: '' })
      setPilotStatus('idle')
      onSuccess?.()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'שגיאה ביצירת ההזמנה' })
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const inputClass = "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div>
        <label className="block text-slate-600 text-sm font-medium mb-1.5">שם הטייס</label>
        <div className="relative">
          <input type="text" required value={form.pilot_name}
            onChange={(e) => { setForm({ ...form, pilot_name: e.target.value }); setPilotStatus('idle') }}
            placeholder="הכנס שם מלא" className={inputClass} />
          {pilotStatus === 'checking' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⏳</span>}
          {pilotStatus === 'found' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">✓</span>}
        </div>
        {pilotStatus === 'found' && <p className="text-green-600 text-xs mt-1 font-medium">✓ טייס קיים במערכת</p>}
      </div>

      {pilotStatus === 'new' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-xl">👋</span>
            <div>
              <p className="text-blue-800 font-bold text-sm">טייס חדש!</p>
              <p className="text-blue-600 text-xs">לא מצאנו אותך במערכת. מלא פרטים נוספים כדי להירשם.</p>
            </div>
          </div>
          <div>
            <label className="block text-blue-700 text-xs font-semibold mb-1">מספר רישיון טיס</label>
            <input type="text" value={newPilotFields.license_number}
              onChange={e => setNewPilotFields({ license_number: e.target.value })}
              placeholder="לדוגמה: IL-PPL-12345"
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-blue-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm" />
          </div>
        </div>
      )}

      <div>
        <label className="block text-slate-600 text-sm font-medium mb-1.5">טלפון</label>
        {pilotStatus === 'found' && form.phone ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-slate-700">
            <span className="text-green-600">📱</span>
            <span className="flex-1">{form.phone}</span>
            <button type="button" onClick={() => setPilotStatus('idle')}
              className="text-xs text-gray-400 hover:text-gray-600 underline">שנה</button>
          </div>
        ) : (
          <input type="tel" required value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="050-0000000" className={inputClass} />
        )}
      </div>

      <div>
        <label className="block text-slate-600 text-sm font-medium mb-1.5">מטרת הטיסה</label>
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
        <label className="block text-slate-600 text-sm font-medium mb-1.5">תאריך</label>
        <input type="date" required min={today} value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 text-sm font-medium mb-1.5">שעת התחלה</label>
          <input type="time" required value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            className={inputClass} />
        </div>
        <div>
          <label className="block text-slate-600 text-sm font-medium mb-1.5">שעת סיום</label>
          <input type="time" required value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            className={inputClass} />
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200">
          <input type="checkbox" checked={form.with_instructor}
            onChange={(e) => setForm({ ...form, with_instructor: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-400" />
          <span className="text-slate-700 text-base font-medium">טיסה עם מדריך</span>
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
        className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors shadow-sm">
        {submitting ? 'שולח...' : pilotStatus === 'new' ? 'הירשם ושלח הזמנה ✈️' : 'שלח הזמנה ✈️'}
      </button>

      {message && (
        <div className={`p-4 rounded-xl text-center font-medium text-sm ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
    </form>
  )
}
