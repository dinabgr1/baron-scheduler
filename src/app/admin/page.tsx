'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import WeeklyCalendar from '@/components/WeeklyCalendar'
import { Booking, FlightLog } from '@/lib/supabase'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [flightLogs, setFlightLogs] = useState<FlightLog[]>([])
  const [view, setView] = useState<'calendar' | 'list'>('list')
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Booking>>({})
  const [selectedFlightLog, setSelectedFlightLog] = useState<string | null>(null)
  const [calendarKey, setCalendarKey] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addForm, setAddForm] = useState({
    pilot_name: '',
    date: '',
    start_time: '',
    end_time: '',
    with_instructor: false,
    instructor_name: 'Shani Segev',
    status: 'approved' as 'pending' | 'approved' | 'rejected',
  })

  async function createAdminBooking(e: React.FormEvent) {
    e.preventDefault()
    setAddSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (!res.ok) throw new Error('Failed')

      // If status is not pending, update it
      if (addForm.status !== 'pending') {
        const booking = await res.json()
        await fetch(`/api/bookings/${booking.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: addForm.status }),
        })
      }

      setAddForm({ pilot_name: '', date: '', start_time: '', end_time: '', with_instructor: false, instructor_name: 'Shani Segev', status: 'approved' })
      setShowAddForm(false)
      loadBookings()
      setCalendarKey(k => k + 1)
    } catch {
      alert('שגיאה ביצירת ההזמנה')
    } finally {
      setAddSubmitting(false)
    }
  }

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthed(true)
      loadBookings()
      loadFlightLogs()
    } else {
      setLoginError('סיסמה שגויה')
    }
  }

  async function loadBookings() {
    setLoading(true)
    const res = await fetch('/api/bookings')
    const data = await res.json()
    if (Array.isArray(data)) {
      setBookings(data.sort((a: Booking, b: Booking) => {
        const dateComp = b.date.localeCompare(a.date)
        if (dateComp !== 0) return dateComp
        return b.start_time.localeCompare(a.start_time)
      }))
    }
    setLoading(false)
  }

  async function loadFlightLogs() {
    const res = await fetch('/api/flight-logs')
    const data = await res.json()
    if (Array.isArray(data)) {
      setFlightLogs(data)
    }
  }

  async function updateBookingStatus(id: string, status: 'approved' | 'rejected') {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadBookings()
    setCalendarKey((k) => k + 1)
  }

  async function deleteBooking(id: string) {
    if (!confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) return
    await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    loadBookings()
    setCalendarKey((k) => k + 1)
  }

  async function saveEdit(id: string) {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditingId(null)
    setEditForm({})
    loadBookings()
    setCalendarKey((k) => k + 1)
  }

  function startEdit(booking: Booking) {
    setEditingId(booking.id)
    setEditForm({
      pilot_name: booking.pilot_name,
      date: booking.date,
      start_time: booking.start_time,
      end_time: booking.end_time,
    })
  }

  function getFlightLogForBooking(bookingId: string): FlightLog | undefined {
    return flightLogs.find((log: any) => {
      const bid = typeof log.booking_id === 'string' ? log.booking_id : log.booking_id
      return bid === bookingId
    })
  }

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter)

  if (!authed) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-sm mx-auto px-4 py-20">
          <div className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-6">
            <h2 className="text-white font-bold text-xl text-center mb-6">🔐 כניסת מנהל</h2>
            <form onSubmit={login} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה"
                className="w-full px-4 py-3 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white placeholder-baron-blue-400 focus:outline-none focus:border-baron-blue-400 text-lg text-center"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-baron-blue-500 hover:bg-baron-blue-400 text-white font-bold text-lg transition-colors"
              >
                כניסה
              </button>
              {loginError && (
                <p className="text-red-400 text-center text-sm">{loginError}</p>
              )}
            </form>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">פאנל ניהול</h2>
          <p className="text-baron-blue-300">ניהול הזמנות ונתוני טיסה | Baron 4X-DZJ</p>
        </div>

        {/* View toggle + filter */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-baron-blue-500 text-white'
                  : 'bg-baron-blue-800/50 text-baron-blue-300 hover:text-white'
              }`}
            >
              📋 רשימה
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'calendar'
                  ? 'bg-baron-blue-500 text-white'
                  : 'bg-baron-blue-800/50 text-baron-blue-300 hover:text-white'
              }`}
            >
              📅 לוח שנה
            </button>
          </div>

          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-baron-blue-500 text-white'
                    : 'bg-baron-blue-800/50 text-baron-blue-300 hover:text-white'
                }`}
              >
                {f === 'all' ? 'הכל' : f === 'pending' ? 'ממתין' : f === 'approved' ? 'מאושר' : 'נדחה'}
                {f !== 'all' && (
                  <span className="mr-1 opacity-75">
                    ({bookings.filter((b) => b.status === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Add booking button + form */}
        <div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showAddForm
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {showAddForm ? '✕ סגור' : '➕ הוסף הזמנה'}
          </button>

          {showAddForm && (
            <form onSubmit={createAdminBooking} className="mt-3 bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-4 space-y-3">
              <h3 className="text-white font-bold text-lg">הוספת הזמנה (מנהל)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-baron-blue-200 text-xs font-medium mb-1">שם הטייס</label>
                  <input type="text" required value={addForm.pilot_name}
                    onChange={e => setAddForm({ ...addForm, pilot_name: e.target.value })}
                    placeholder="שם מלא"
                    className="w-full px-3 py-2 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white placeholder-baron-blue-400 text-sm focus:outline-none focus:border-baron-blue-400" />
                </div>
                <div>
                  <label className="block text-baron-blue-200 text-xs font-medium mb-1">תאריך</label>
                  <input type="date" required value={addForm.date}
                    onChange={e => setAddForm({ ...addForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm focus:outline-none focus:border-baron-blue-400" />
                </div>
                <div>
                  <label className="block text-baron-blue-200 text-xs font-medium mb-1">שעת התחלה</label>
                  <input type="time" required value={addForm.start_time}
                    onChange={e => setAddForm({ ...addForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm focus:outline-none focus:border-baron-blue-400" />
                </div>
                <div>
                  <label className="block text-baron-blue-200 text-xs font-medium mb-1">שעת סיום</label>
                  <input type="time" required value={addForm.end_time}
                    onChange={e => setAddForm({ ...addForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm focus:outline-none focus:border-baron-blue-400" />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={addForm.with_instructor}
                    onChange={e => setAddForm({ ...addForm, with_instructor: e.target.checked })}
                    className="w-4 h-4 rounded border-baron-blue-500 text-blue-500" />
                  <span className="text-baron-blue-200 text-sm">עם מדריך</span>
                </label>
                {addForm.with_instructor && (
                  <select value={addForm.instructor_name}
                    onChange={e => setAddForm({ ...addForm, instructor_name: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm">
                    <option value="Shani Segev">שני שגיב</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-baron-blue-200 text-xs font-medium mb-1">סטטוס</label>
                <div className="flex gap-2">
                  {([
                    { value: 'approved', label: 'מאושר', color: 'bg-green-600 hover:bg-green-500' },
                    { value: 'pending', label: 'ממתין', color: 'bg-yellow-600 hover:bg-yellow-500' },
                    { value: 'rejected', label: 'נדחה', color: 'bg-red-600 hover:bg-red-500' },
                  ] as const).map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setAddForm({ ...addForm, status: s.value })}
                      className={`px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors ${
                        addForm.status === s.value ? s.color + ' ring-2 ring-white/50' : 'bg-baron-blue-700/50 text-baron-blue-300'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={addSubmitting}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-baron-blue-700 text-white font-bold text-sm transition-colors">
                {addSubmitting ? 'יוצר...' : 'צור הזמנה'}
              </button>
            </form>
          )}
        </div>

        {/* Calendar View */}
        {view === 'calendar' && <WeeklyCalendar key={calendarKey} />}

        {/* List View */}
        {view === 'list' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-baron-blue-300 py-8">טוען...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center text-baron-blue-300 py-8">אין הזמנות</div>
            ) : (
              filteredBookings.map((b) => {
                const flightLog = getFlightLogForBooking(b.id)
                const isEditing = editingId === b.id

                return (
                  <div
                    key={b.id}
                    className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-4"
                  >
                    <div className="flex flex-wrap gap-4 justify-between items-start">
                      {/* Booking info */}
                      <div className="flex-1 min-w-[200px]">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.pilot_name || ''}
                              onChange={(e) => setEditForm({ ...editForm, pilot_name: e.target.value })}
                              className="w-full px-3 py-2 rounded bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="date"
                                value={editForm.date || ''}
                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                className="px-2 py-1 rounded bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm"
                              />
                              <input
                                type="time"
                                value={editForm.start_time || ''}
                                onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                className="px-2 py-1 rounded bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm"
                              />
                              <input
                                type="time"
                                value={editForm.end_time || ''}
                                onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                className="px-2 py-1 rounded bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(b.id)}
                                className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-sm"
                              >
                                שמור
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 rounded bg-baron-blue-700 hover:bg-baron-blue-600 text-white text-sm"
                              >
                                ביטול
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-bold text-lg">{b.pilot_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                b.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                                b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-red-500/20 text-red-300'
                              }`}>
                                {b.status === 'approved' ? '✅ מאושר' : b.status === 'pending' ? '⏳ ממתין' : '❌ נדחה'}
                              </span>
                            </div>
                            <div className="text-baron-blue-300 text-sm space-y-0.5">
                              <div>📅 {b.date} | 🕐 {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</div>
                              {b.with_instructor && (
                                <div>👨‍✈️ מדריך: {b.instructor_name}</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      {!isEditing && (
                        <div className="flex flex-wrap gap-2">
                          {b.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateBookingStatus(b.id, 'approved')}
                                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
                              >
                                ✅ אשר
                              </button>
                              <button
                                onClick={() => updateBookingStatus(b.id, 'rejected')}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
                              >
                                ❌ דחה
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => startEdit(b)}
                            className="px-4 py-2 rounded-lg bg-baron-blue-600 hover:bg-baron-blue-500 text-white text-sm font-medium transition-colors"
                          >
                            ✏️ ערוך
                          </button>
                          <button
                            onClick={() => deleteBooking(b.id)}
                            className="px-4 py-2 rounded-lg bg-baron-blue-800 hover:bg-red-600 text-baron-blue-300 hover:text-white text-sm font-medium transition-colors"
                          >
                            🗑️ מחק
                          </button>
                          {flightLog && (
                            <button
                              onClick={() => setSelectedFlightLog(
                                selectedFlightLog === b.id ? null : b.id
                              )}
                              className="px-4 py-2 rounded-lg bg-baron-blue-700 hover:bg-baron-blue-600 text-baron-blue-200 text-sm font-medium transition-colors"
                            >
                              📊 נתוני טיסה
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Flight log details */}
                    {selectedFlightLog === b.id && flightLog && (
                      <div className="mt-4 pt-4 border-t border-baron-blue-700/50">
                        <h4 className="text-baron-blue-200 font-medium text-sm mb-2">נתוני טיסה</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-baron-blue-400">Hobbs:</span>
                            <span className="text-white mr-1">{flightLog.hobbs_start} → {flightLog.hobbs_end}</span>
                          </div>
                          <div>
                            <span className="text-baron-blue-400">זמן טיסה:</span>
                            <span className="text-white mr-1">{flightLog.flight_time_hours}:{String(flightLog.flight_time_minutes).padStart(2, '0')}</span>
                          </div>
                          <div>
                            <span className="text-baron-blue-400">דלק שהוסף:</span>
                            <span className="text-white mr-1">{flightLog.fuel_added_liters}L</span>
                          </div>
                          <div>
                            <span className="text-baron-blue-400">מפלס דלק:</span>
                            <span className="text-white mr-1">{flightLog.fuel_level_quarters}/4</span>
                          </div>
                          <div>
                            <span className="text-baron-blue-400">שמן מנוע 1:</span>
                            <span className="text-white mr-1">{flightLog.oil_engine1}qt</span>
                          </div>
                          <div>
                            <span className="text-baron-blue-400">שמן מנוע 2:</span>
                            <span className="text-white mr-1">{flightLog.oil_engine2}qt</span>
                          </div>
                          {flightLog.notes && (
                            <div className="col-span-2">
                              <span className="text-baron-blue-400">הערות:</span>
                              <span className="text-white mr-1">{flightLog.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
