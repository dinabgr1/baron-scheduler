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
      setForm({
        pilot_name: '',
        date: '',
        start_time: '',
        end_time: '',
        with_instructor: false,
        instructor_name: 'Shani Segev',
      })
      onSuccess?.()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'שגיאה ביצירת ההזמנה',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Default date to today
  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pilot Name */}
      <div>
        <label className="block text-baron-blue-200 text-sm font-medium mb-1">
          שם הטייס
        </label>
        <input
          type="text"
          required
          value={form.pilot_name}
          onChange={(e) => setForm({ ...form, pilot_name: e.target.value })}
          placeholder="הכנס שם מלא"
          className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white placeholder-baron-blue-400 focus:outline-none focus:border-baron-blue-400 focus:ring-1 focus:ring-baron-blue-400 text-lg"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-baron-blue-200 text-sm font-medium mb-1">
          תאריך
        </label>
        <input
          type="date"
          required
          min={today}
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 focus:ring-1 focus:ring-baron-blue-400 text-lg"
        />
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-baron-blue-200 text-sm font-medium mb-1">
            שעת התחלה
          </label>
          <input
            type="time"
            required
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 focus:ring-1 focus:ring-baron-blue-400 text-lg"
          />
        </div>
        <div>
          <label className="block text-baron-blue-200 text-sm font-medium mb-1">
            שעת סיום
          </label>
          <input
            type="time"
            required
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 focus:ring-1 focus:ring-baron-blue-400 text-lg"
          />
        </div>
      </div>

      {/* Instructor */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.with_instructor}
            onChange={(e) => setForm({ ...form, with_instructor: e.target.checked })}
            className="w-5 h-5 rounded border-baron-blue-600 bg-baron-blue-800/50 text-baron-blue-500 focus:ring-baron-blue-400"
          />
          <span className="text-white text-lg">טיסה עם מדריך</span>
        </label>

        {form.with_instructor && (
          <select
            value={form.instructor_name}
            onChange={(e) => setForm({ ...form, instructor_name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 focus:ring-1 focus:ring-baron-blue-400 text-lg"
          >
            <option value="Shani Segev">Shani Segev</option>
          </select>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 rounded-xl bg-baron-blue-500 hover:bg-baron-blue-400 disabled:bg-baron-blue-700 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors shadow-lg"
      >
        {submitting ? 'שולח...' : 'שלח הזמנה ✈️'}
      </button>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg text-center font-medium ${
            message.type === 'success'
              ? 'bg-green-500/20 border border-green-500/50 text-green-200'
              : 'bg-red-500/20 border border-red-500/50 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </form>
  )
}
