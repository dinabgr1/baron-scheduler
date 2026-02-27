'use client'

import { useState, useEffect } from 'react'
import { Booking } from '@/lib/supabase'
import FuelCalculator from './FuelCalculator'

type Step = 'name' | 'select' | 'form' | 'done'

export default function PostFlightForm() {
  const [step, setStep] = useState<Step>('name')
  const [pilotName, setPilotName] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [lastHobbs, setLastHobbs] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    hobbs_start: '',
    hobbs_end: '',
    flight_time_hours: '',
    flight_time_minutes: '',
    fuel_added_liters: '0',
    fuel_level_quarters: '4',
    oil_engine1: '',
    oil_engine2: '',
    notes: '',
  })

  async function searchBookings() {
    if (!pilotName.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/bookings?pilot_name=${encodeURIComponent(pilotName)}`)
      const data = await res.json()

      if (!Array.isArray(data) || data.length === 0) {
        setError('לא נמצאו הזמנות עבור שם זה')
        setLoading(false)
        return
      }

      // Sort: today and recent first
      const sorted = data.sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })

      setBookings(sorted)
      setStep('select')

      // Get last hobbs from flight logs
      const logsRes = await fetch('/api/flight-logs')
      const logs = await logsRes.json()
      if (Array.isArray(logs) && logs.length > 0) {
        setLastHobbs(logs[0].hobbs_end || 0)
      }
    } catch {
      setError('שגיאה בחיפוש הזמנות')
    } finally {
      setLoading(false)
    }
  }

  function selectBooking(booking: Booking) {
    setSelectedBooking(booking)
    setForm((f) => ({ ...f, hobbs_start: lastHobbs ? String(lastHobbs) : '' }))
    setStep('form')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBooking) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/flight-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: selectedBooking.id,
          ...form,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save flight log')
      }

      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירת הנתונים')
    } finally {
      setSubmitting(false)
    }
  }

  // Step 1: Enter name
  if (step === 'name') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-baron-blue-200 text-sm font-medium mb-1">שם הטייס</label>
          <input
            type="text"
            value={pilotName}
            onChange={(e) => setPilotName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchBookings()}
            placeholder="הכנס את שמך"
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white placeholder-baron-blue-400 focus:outline-none focus:border-baron-blue-400 text-lg"
          />
        </div>
        <button
          onClick={searchBookings}
          disabled={loading || !pilotName.trim()}
          className="w-full py-4 rounded-xl bg-baron-blue-500 hover:bg-baron-blue-400 disabled:bg-baron-blue-700 text-white font-bold text-lg transition-colors"
        >
          {loading ? 'מחפש...' : 'חפש הזמנות 🔍'}
        </button>
        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-center">
            {error}
          </div>
        )}
      </div>
    )
  }

  // Step 2: Select booking
  if (step === 'select') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setStep('name')}
          className="text-baron-blue-300 hover:text-white text-sm transition-colors"
        >
          → חזור
        </button>
        <h3 className="text-white font-bold text-lg">בחר טיסה: {pilotName}</h3>
        <div className="space-y-2">
          {bookings.map((b) => (
            <button
              key={b.id}
              onClick={() => selectBooking(b)}
              className="w-full p-4 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 hover:border-baron-blue-400 text-right transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className={`text-xs px-2 py-1 rounded ${
                  b.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                  b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {b.status === 'approved' ? 'מאושר' : b.status === 'pending' ? 'ממתין' : 'נדחה'}
                </span>
                <div>
                  <div className="text-white font-medium">{b.date}</div>
                  <div className="text-baron-blue-300 text-sm">
                    {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                    {b.with_instructor && ` | מדריך: ${b.instructor_name}`}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Step 4: Done
  if (step === 'done') {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="text-5xl">✅</div>
        <h3 className="text-white font-bold text-xl">הנתונים נשמרו בהצלחה!</h3>
        <button
          onClick={() => {
            setStep('name')
            setPilotName('')
            setSelectedBooking(null)
          }}
          className="px-6 py-3 rounded-xl bg-baron-blue-500 hover:bg-baron-blue-400 text-white font-bold transition-colors"
        >
          דיווח נוסף
        </button>
      </div>
    )
  }

  // Step 3: Flight data form
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={() => setStep('select')}
        className="text-baron-blue-300 hover:text-white text-sm transition-colors"
      >
        → חזור
      </button>

      <div className="bg-baron-blue-800/30 rounded-lg p-3 border border-baron-blue-700/50">
        <div className="text-white font-medium">{selectedBooking?.date}</div>
        <div className="text-baron-blue-300 text-sm">
          {selectedBooking?.start_time.slice(0, 5)} - {selectedBooking?.end_time.slice(0, 5)}
        </div>
      </div>

      {/* Hobbs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-baron-blue-200 text-sm font-medium mb-1">Hobbs התחלה</label>
          <input
            type="number"
            step="0.1"
            required
            value={form.hobbs_start}
            onChange={(e) => setForm({ ...form, hobbs_start: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 text-lg"
          />
        </div>
        <div>
          <label className="block text-baron-blue-200 text-sm font-medium mb-1">Hobbs סיום</label>
          <input
            type="number"
            step="0.1"
            required
            value={form.hobbs_end}
            onChange={(e) => setForm({ ...form, hobbs_end: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 text-lg"
          />
        </div>
      </div>

      {/* Flight time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-baron-blue-200 text-sm font-medium mb-1">זמן טיסה (שעות)</label>
          <input
            type="number"
            min="0"
            required
            value={form.flight_time_hours}
            onChange={(e) => setForm({ ...form, flight_time_hours: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 text-lg"
          />
        </div>
        <div>
          <label className="block text-baron-blue-200 text-sm font-medium mb-1">זמן טיסה (דקות)</label>
          <input
            type="number"
            min="0"
            max="59"
            required
            value={form.flight_time_minutes}
            onChange={(e) => setForm({ ...form, flight_time_minutes: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 text-lg"
          />
        </div>
      </div>

      {/* Fuel */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-baron-blue-200 text-sm font-medium mb-1">דלק שהוסף (ליטר)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={form.fuel_added_liters}
            onChange={(e) => setForm({ ...form, fuel_added_liters: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 text-lg"
          />
        </div>
        <div>
          <label className="block text-baron-blue-200 text-sm font-medium mb-1">מפלס דלק נוכחי</label>
          <select
            value={form.fuel_level_quarters}
            onChange={(e) => setForm({ ...form, fuel_level_quarters: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 text-lg"
          >
            <option value="1">1/4</option>
            <option value="2">2/4</option>
            <option value="3">3/4</option>
            <option value="4">4/4 (מלא)</option>
          </select>
        </div>
      </div>

      {/* Oil */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-baron-blue-200 text-sm font-medium mb-1">שמן מנוע 1 (quarts)</label>
          <input
            type="number"
            step="0.25"
            min="0"
            required
            value={form.oil_engine1}
            onChange={(e) => setForm({ ...form, oil_engine1: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 text-lg"
          />
        </div>
        <div>
          <label className="block text-baron-blue-200 text-sm font-medium mb-1">שמן מנוע 2 (quarts)</label>
          <input
            type="number"
            step="0.25"
            min="0"
            required
            value={form.oil_engine2}
            onChange={(e) => setForm({ ...form, oil_engine2: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white focus:outline-none focus:border-baron-blue-400 text-lg"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-baron-blue-200 text-sm font-medium mb-1">הערות</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          placeholder="הערות אופציונליות..."
          className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white placeholder-baron-blue-400 focus:outline-none focus:border-baron-blue-400 text-lg resize-none"
        />
      </div>

      {/* Fuel Calculator */}
      <FuelCalculator />

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-baron-blue-700 text-white font-bold text-lg transition-colors shadow-lg"
      >
        {submitting ? 'שומר...' : 'שמור דיווח ✅'}
      </button>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-center">
          {error}
        </div>
      )}
    </form>
  )
}
