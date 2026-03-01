'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Booking, FlightLog } from '@/lib/supabase'

type Step = 'name' | 'select' | 'form' | 'done'

export default function PostFlightForm() {
  const searchParams = useSearchParams()
  const bookingIdParam = searchParams.get('booking_id')
  const editMode = searchParams.get('edit') === '1'

  const [step, setStep] = useState<Step>('name')
  const [pilotName, setPilotName] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [existingLogId, setExistingLogId] = useState<string | null>(null)
  const [lastHobbs, setLastHobbs] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [initialLoading, setInitialLoading] = useState(!!bookingIdParam)

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

  // Auto-load booking from URL param
  useEffect(() => {
    if (!bookingIdParam) return

    async function loadBooking() {
      try {
        const [bookingRes, logsRes] = await Promise.all([
          fetch(`/api/bookings/${bookingIdParam}`),
          fetch(`/api/flight-logs?booking_id=${bookingIdParam}`),
        ])
        const booking = await bookingRes.json()
        const logs = await logsRes.json()

        if (booking && booking.id) {
          setSelectedBooking(booking)
          setPilotName(booking.pilot_name)

          if (editMode && Array.isArray(logs) && logs.length > 0) {
            // Edit mode: pre-fill with existing log data
            const log: FlightLog = logs[0]
            setExistingLogId(log.id)
            setForm({
              hobbs_start: String(log.hobbs_start),
              hobbs_end: String(log.hobbs_end),
              flight_time_hours: String(log.flight_time_hours),
              flight_time_minutes: String(log.flight_time_minutes),
              fuel_added_liters: String(log.fuel_added_liters),
              fuel_level_quarters: String(log.fuel_level_quarters),
              oil_engine1: String(log.oil_engine1),
              oil_engine2: String(log.oil_engine2),
              notes: log.notes || '',
            })
          } else {
            // New submission: pre-fill last hobbs
            const allLogsRes = await fetch('/api/flight-logs')
            const allLogs = await allLogsRes.json()
            if (Array.isArray(allLogs) && allLogs.length > 0) {
              setLastHobbs(allLogs[0].hobbs_end || 0)
              setForm(f => ({ ...f, hobbs_start: allLogs[0].hobbs_end ? String(allLogs[0].hobbs_end) : '' }))
            }
          }
          setStep('form')
        }
      } catch {
        setError('שגיאה בטעינת ההזמנה')
      } finally {
        setInitialLoading(false)
      }
    }

    loadBooking()
  }, [bookingIdParam, editMode])

  if (initialLoading) {
    return <div className="p-8 text-center text-gray-500">טוען הזמנה...</div>
  }

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

      const sorted = data.sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })

      setBookings(sorted)
      setStep('select')

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
      let res: Response

      if (editMode && existingLogId) {
        // PATCH existing log
        res = await fetch(`/api/flight-logs/${existingLogId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        // POST new log
        res = await fetch('/api/flight-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: selectedBooking.id,
            ...form,
          }),
        })
      }

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

  const isEditing = editMode && !!existingLogId
  const formTitle = isEditing ? 'עריכת דיווח' : 'דיווח לאחר טיסה'

  // Step 1: Enter name
  if (step === 'name') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">שם הטייס</label>
          <input
            type="text"
            value={pilotName}
            onChange={(e) => setPilotName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchBookings()}
            placeholder="הכנס את שמך"
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
          />
        </div>
        <button
          onClick={searchBookings}
          disabled={loading || !pilotName.trim()}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 text-white font-bold text-lg transition-colors"
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
          className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          → חזור
        </button>
        <h3 className="text-gray-900 font-bold text-lg">בחר טיסה: {pilotName}</h3>
        <div className="space-y-2">
          {bookings.map((b) => (
            <button
              key={b.id}
              onClick={() => selectBooking(b)}
              className="w-full p-4 rounded-lg bg-gray-50 border border-gray-300 hover:border-blue-500 text-right transition-colors"
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
                  <div className="text-gray-900 font-medium">{b.date}</div>
                  <div className="text-gray-500 text-sm">
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
        <h3 className="text-gray-900 font-bold text-xl">
          {isEditing ? 'הדיווח עודכן בהצלחה!' : 'הנתונים נשמרו בהצלחה!'}
        </h3>
        <button
          onClick={() => {
            setStep('name')
            setPilotName('')
            setSelectedBooking(null)
            setExistingLogId(null)
          }}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
        >
          דיווח נוסף
        </button>
      </div>
    )
  }

  // Step 3: Flight data form
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!bookingIdParam && (
        <button
          type="button"
          onClick={() => setStep('select')}
          className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          → חזור
        </button>
      )}

      {isEditing && (
        <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-center text-sm font-medium">
          מצב עריכה — ניתן לערוך את הדיווח עד שעה מרגע ההגשה
        </div>
      )}

      <div className="bg-gray-100/30 rounded-lg p-3 border border-gray-200">
        <div className="text-gray-900 font-medium">{selectedBooking?.date}</div>
        <div className="text-gray-500 text-sm">
          {selectedBooking?.start_time.slice(0, 5)} - {selectedBooking?.end_time.slice(0, 5)}
        </div>
      </div>

      {/* Hobbs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Hobbs התחלה</label>
          <input
            type="number"
            step="0.1"
            required
            value={form.hobbs_start}
            onChange={(e) => setForm({ ...form, hobbs_start: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Hobbs סיום</label>
          <input
            type="number"
            step="0.1"
            required
            value={form.hobbs_end}
            onChange={(e) => setForm({ ...form, hobbs_end: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
          />
        </div>
      </div>

      {/* Flight time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">זמן טיסה (שעות)</label>
          <input
            type="number"
            min="0"
            required
            value={form.flight_time_hours}
            onChange={(e) => setForm({ ...form, flight_time_hours: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">זמן טיסה (דקות)</label>
          <input
            type="number"
            min="0"
            max="59"
            required
            value={form.flight_time_minutes}
            onChange={(e) => setForm({ ...form, flight_time_minutes: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
          />
        </div>
      </div>

      {/* Fuel */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">דלק שהוסף (ליטר)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={form.fuel_added_liters}
            onChange={(e) => setForm({ ...form, fuel_added_liters: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">מפלס דלק נוכחי</label>
          <select
            value={form.fuel_level_quarters}
            onChange={(e) => setForm({ ...form, fuel_level_quarters: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
          >
            <option value="1">¼ (כ-41 גלון)</option>
            <option value="2">½ (כ-83 גלון)</option>
            <option value="3">¾ (כ-125 גלון)</option>
            <option value="4">מלא (166 גלון)</option>
          </select>
        </div>
      </div>

      {/* Oil */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">שמן מנוע 1 (quarts)</label>
          <input
            type="number"
            step="0.25"
            min="0"
            required
            value={form.oil_engine1}
            onChange={(e) => setForm({ ...form, oil_engine1: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">שמן מנוע 2 (quarts)</label>
          <input
            type="number"
            step="0.25"
            min="0"
            required
            value={form.oil_engine2}
            onChange={(e) => setForm({ ...form, oil_engine2: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">הערות</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          placeholder="הערות אופציונליות..."
          className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-colors shadow-lg disabled:bg-gray-300 ${
          isEditing
            ? 'bg-amber-600 hover:bg-amber-500'
            : 'bg-green-600 hover:bg-green-500'
        }`}
      >
        {submitting ? 'שומר...' : isEditing ? 'עדכן דיווח ✏️' : 'שמור דיווח ✅'}
      </button>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-center">
          {error}
        </div>
      )}
    </form>
  )
}
