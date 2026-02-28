'use client'

import { useState } from 'react'

export default function BookingForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    pilot_name: '',
    date: '',
    start_time: '',
    end_time: '',
    with_instructor: false,
    instructor_name: 'Shani Segev',
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
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
      setForm({ pilot_name: '', date: '', start_time: '', end_time: '', with_instructor: false, instructor_name: 'Shani Segev' })
      onSuccess?.()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'שגיאה ביצירת ההזמנה' })
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const inputClass = "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-base"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-slate-600 text-sm font-medium mb-1.5">שם הטייס</label>
        <input type="text" required value={form.pilot_name}
          onChange={(e) => setForm({ ...form, pilot_name: e.target.value })}
          placeholder="הכנס שם מלא" className={inputClass} />
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

      <button type="submit" disabled={submitting}
        className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors shadow-sm">
        {submitting ? 'שולח...' : 'שלח הזמנה ✈️'}
      </button>

      {message && (
        <div className={`p-4 rounded-xl text-center font-medium text-sm ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
    </form>
  )
}
