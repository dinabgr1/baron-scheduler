'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import WeeklyCalendar from '@/components/WeeklyCalendar'
import { Booking, FlightLog, Pilot, Rate, HourPackage } from '@/lib/supabase'

type AdminTab = 'הזמנות' | 'טייסים' | 'תעריפים' | 'בנק שעות'

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
  const [activeTab, setActiveTab] = useState<AdminTab>('הזמנות')
  const [addForm, setAddForm] = useState({
    pilot_name: '',
    date: '',
    start_time: '',
    end_time: '',
    with_instructor: false,
    instructor_name: 'Shani Segev',
    status: 'approved' as 'pending' | 'approved' | 'rejected',
  })

  // Pilots state
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [pilotForm, setPilotForm] = useState({ name: '', phone: '', license_number: '' })
  const [editingPilotId, setEditingPilotId] = useState<string | null>(null)
  const [editPilotForm, setEditPilotForm] = useState<Partial<Pilot>>({})
  const [showAddPilotForm, setShowAddPilotForm] = useState(false)

  // Rates state
  const [rates, setRates] = useState<Rate[]>([])
  const [rateForm, setRateForm] = useState({ name: '', rate_per_hour: '', description: '' })
  const [editingRateId, setEditingRateId] = useState<string | null>(null)
  const [editRateForm, setEditRateForm] = useState<Partial<Rate>>({})

  // Hour packages state
  const [hourPackages, setHourPackages] = useState<HourPackage[]>([])
  const [packageForm, setPackageForm] = useState({ pilot_name: '', hours_purchased: '', price_paid: '', purchase_date: new Date().toISOString().split('T')[0], notes: '' })

  // Stats
  const [stats, setStats] = useState({ totalBookings: 0, pendingBookings: 0, flightHours: 0, lastHobbs: 0 })

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

  async function loadPilots() {
    const res = await fetch('/api/pilots')
    const data = await res.json()
    if (Array.isArray(data)) setPilots(data)
  }

  async function loadRates() {
    const res = await fetch('/api/rates')
    const data = await res.json()
    if (Array.isArray(data)) setRates(data)
  }

  async function loadHourPackages() {
    const res = await fetch('/api/hour-packages')
    const data = await res.json()
    if (Array.isArray(data)) setHourPackages(data)
  }

  // Compute stats when bookings/flightLogs change
  useEffect(() => {
    if (!authed) return
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthBookings = bookings.filter(b => b.date.startsWith(currentMonth))
    const pendingCount = bookings.filter(b => b.status === 'pending').length

    let totalHours = 0
    flightLogs.forEach(log => {
      totalHours += (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
    })
    // Filter flight hours for current month using booking date
    const monthFlightLogs = flightLogs.filter(log => {
      const booking = bookings.find(b => b.id === log.booking_id)
      return booking && booking.date.startsWith(currentMonth)
    })
    let monthHours = 0
    monthFlightLogs.forEach(log => {
      monthHours += (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
    })

    const lastHobbs = flightLogs.length > 0
      ? Math.max(...flightLogs.map(l => l.hobbs_end || 0))
      : 0

    setStats({
      totalBookings: monthBookings.length,
      pendingBookings: pendingCount,
      flightHours: Math.round(monthHours * 10) / 10,
      lastHobbs: Math.round(lastHobbs * 10) / 10,
    })
  }, [bookings, flightLogs, authed])

  // Load tab data
  useEffect(() => {
    if (!authed) return
    if (activeTab === 'הזמנות') loadPilots()
    if (activeTab === 'טייסים') { loadPilots(); loadHourPackages(); loadBookings() }
    if (activeTab === 'תעריפים') loadRates()
    if (activeTab === 'בנק שעות') loadHourPackages()
  }, [activeTab, authed])

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
    return flightLogs.find((log) => {
      const bid = typeof log.booking_id === 'string' ? log.booking_id : log.booking_id
      return bid === bookingId
    })
  }

  // Pilot CRUD
  async function addPilot(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/pilots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pilotForm),
    })
    setPilotForm({ name: '', phone: '', license_number: '' })
    loadPilots()
  }

  async function deletePilot(id: string) {
    if (!confirm('למחוק טייס?')) return
    await fetch(`/api/pilots/${id}`, { method: 'DELETE' })
    loadPilots()
  }

  async function savePilotEdit(id: string) {
    await fetch(`/api/pilots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editPilotForm),
    })
    setEditingPilotId(null)
    setEditPilotForm({})
    loadPilots()
  }

  // Rate CRUD
  async function addRate(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rateForm, rate_per_hour: parseFloat(rateForm.rate_per_hour) }),
    })
    setRateForm({ name: '', rate_per_hour: '', description: '' })
    loadRates()
  }

  async function deleteRate(id: string) {
    if (!confirm('למחוק תעריף?')) return
    await fetch(`/api/rates/${id}`, { method: 'DELETE' })
    loadRates()
  }

  async function saveRateEdit(id: string) {
    await fetch(`/api/rates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editRateForm),
    })
    setEditingRateId(null)
    setEditRateForm({})
    loadRates()
  }

  // Hour package CRUD
  async function addPackage(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/hour-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pilot_name: packageForm.pilot_name,
        hours_purchased: parseFloat(packageForm.hours_purchased),
        price_paid: packageForm.price_paid ? parseFloat(packageForm.price_paid) : null,
        purchase_date: packageForm.purchase_date,
        notes: packageForm.notes || null,
      }),
    })
    setPackageForm({ pilot_name: '', hours_purchased: '', price_paid: '', purchase_date: new Date().toISOString().split('T')[0], notes: '' })
    loadHourPackages()
  }

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter)

  const tabs: AdminTab[] = ['הזמנות', 'טייסים', 'תעריפים', 'בנק שעות']

  const inputClass = "w-full px-3 py-2 rounded-lg bg-baron-blue-800/50 border border-baron-blue-600/50 text-white placeholder-baron-blue-400 text-sm focus:outline-none focus:border-baron-blue-400"

  if (!authed) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-sm mx-auto px-4 py-20 pb-20 md:pb-6">
          <div className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-6">
            <h2 className="text-white font-bold text-xl text-center mb-6">כניסת מנהל</h2>
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
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">פאנל ניהול</h2>
          <p className="text-baron-blue-300">ניהול הזמנות ונתוני טיסה | Baron 4X-DZJ</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="text-2xl font-bold text-[#1e3a5f]">{stats.totalBookings}</div>
            <div className="text-gray-500 text-sm">סה&quot;כ הזמנות החודש</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="text-2xl font-bold text-[#1e3a5f]">{stats.pendingBookings}</div>
            <div className="text-gray-500 text-sm">ממתינות לאישור</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="text-2xl font-bold text-[#1e3a5f]">{stats.flightHours}</div>
            <div className="text-gray-500 text-sm">שעות טיסה החודש</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="text-2xl font-bold text-[#1e3a5f]">{stats.lastHobbs}</div>
            <div className="text-gray-500 text-sm">Hobbs אחרון</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-baron-blue-500 text-white'
                  : 'bg-baron-blue-800/50 text-baron-blue-300 hover:text-white'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ====== הזמנות TAB ====== */}
        {activeTab === 'הזמנות' && (
          <>
            {/* View toggle + filter */}
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-2">
                <button onClick={() => setView('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    view === 'list' ? 'bg-baron-blue-500 text-white' : 'bg-baron-blue-800/50 text-baron-blue-300 hover:text-white'
                  }`}>
                  רשימה
                </button>
                <button onClick={() => setView('calendar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    view === 'calendar' ? 'bg-baron-blue-500 text-white' : 'bg-baron-blue-800/50 text-baron-blue-300 hover:text-white'
                  }`}>
                  לוח שנה
                </button>
              </div>

              <div className="flex gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === f ? 'bg-baron-blue-500 text-white' : 'bg-baron-blue-800/50 text-baron-blue-300 hover:text-white'
                    }`}>
                    {f === 'all' ? 'הכל' : f === 'pending' ? 'ממתין' : f === 'approved' ? 'מאושר' : 'נדחה'}
                    {f !== 'all' && (
                      <span className="mr-1 opacity-75">({bookings.filter((b) => b.status === f).length})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Add booking button + form */}
            <div>
              <button onClick={() => setShowAddForm(!showAddForm)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showAddForm ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'
                }`}>
                {showAddForm ? '✕ סגור' : '+ הוסף הזמנה'}
              </button>

              {showAddForm && (
                <form onSubmit={createAdminBooking} className="mt-3 bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-4 space-y-3">
                  <h3 className="text-white font-bold text-lg">הוספת הזמנה (מנהל)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-baron-blue-200 text-xs font-medium mb-1">שם הטייס</label>
                      <input type="text" required value={addForm.pilot_name}
                        onChange={e => setAddForm({ ...addForm, pilot_name: e.target.value })}
                        placeholder="שם מלא" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-baron-blue-200 text-xs font-medium mb-1">תאריך</label>
                      <input type="date" required value={addForm.date}
                        onChange={e => setAddForm({ ...addForm, date: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-baron-blue-200 text-xs font-medium mb-1">שעת התחלה</label>
                      <input type="time" required value={addForm.start_time}
                        onChange={e => setAddForm({ ...addForm, start_time: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-baron-blue-200 text-xs font-medium mb-1">שעת סיום</label>
                      <input type="time" required value={addForm.end_time}
                        onChange={e => setAddForm({ ...addForm, end_time: e.target.value })}
                        className={inputClass} />
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
                      <div key={b.id} className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-4">
                        <div className="flex flex-wrap gap-4 justify-between items-start">
                          <div className="flex-1 min-w-[200px]">
                            {isEditing ? (
                              <div className="space-y-2">
                                <input type="text" value={editForm.pilot_name || ''}
                                  onChange={(e) => setEditForm({ ...editForm, pilot_name: e.target.value })}
                                  className="w-full px-3 py-2 rounded bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm" />
                                <div className="grid grid-cols-3 gap-2">
                                  <input type="date" value={editForm.date || ''}
                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                    className="px-2 py-1 rounded bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm" />
                                  <input type="time" value={editForm.start_time || ''}
                                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                    className="px-2 py-1 rounded bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm" />
                                  <input type="time" value={editForm.end_time || ''}
                                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                    className="px-2 py-1 rounded bg-baron-blue-800/50 border border-baron-blue-600/50 text-white text-sm" />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => saveEdit(b.id)}
                                    className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-sm">שמור</button>
                                  <button onClick={() => setEditingId(null)}
                                    className="px-3 py-1 rounded bg-baron-blue-700 hover:bg-baron-blue-600 text-white text-sm">ביטול</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-white font-bold text-lg">{b.pilot_name}</span>
                                  {(() => {
                                    const matchedPilot = pilots.find(p => p.name === b.pilot_name)
                                    return matchedPilot ? (
                                      <a href={`/admin/pilots/${matchedPilot.id}`} className="text-baron-blue-400 hover:text-white transition-colors" title="כרטיס טייס">👤</a>
                                    ) : null
                                  })()}
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    b.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                                    b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                    'bg-red-500/20 text-red-300'
                                  }`}>
                                    {b.status === 'approved' ? 'מאושר' : b.status === 'pending' ? 'ממתין' : 'נדחה'}
                                  </span>
                                </div>
                                <div className="text-baron-blue-300 text-sm space-y-0.5">
                                  <div>{b.date} | {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</div>
                                  {b.with_instructor && <div>מדריך: {b.instructor_name}</div>}
                                </div>
                              </>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="flex flex-wrap gap-2">
                              {b.status === 'pending' && (
                                <>
                                  <button onClick={() => updateBookingStatus(b.id, 'approved')}
                                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors">
                                    אשר
                                  </button>
                                  <button onClick={() => updateBookingStatus(b.id, 'rejected')}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors">
                                    דחה
                                  </button>
                                </>
                              )}
                              <button onClick={() => startEdit(b)}
                                className="px-4 py-2 rounded-lg bg-baron-blue-600 hover:bg-baron-blue-500 text-white text-sm font-medium transition-colors">
                                ערוך
                              </button>
                              <button onClick={() => deleteBooking(b.id)}
                                className="px-4 py-2 rounded-lg bg-baron-blue-800 hover:bg-red-600 text-baron-blue-300 hover:text-white text-sm font-medium transition-colors">
                                מחק
                              </button>
                              {flightLog && (
                                <button onClick={() => setSelectedFlightLog(selectedFlightLog === b.id ? null : b.id)}
                                  className="px-4 py-2 rounded-lg bg-baron-blue-700 hover:bg-baron-blue-600 text-baron-blue-200 text-sm font-medium transition-colors">
                                  נתוני טיסה
                                </button>
                              )}
                            </div>
                          )}
                        </div>

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
          </>
        )}

        {/* ====== טייסים TAB ====== */}
        {activeTab === 'טייסים' && (
          <div className="space-y-4">
            {/* Add pilot button + form */}
            <div>
              <button onClick={() => setShowAddPilotForm(!showAddPilotForm)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showAddPilotForm ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'
                }`}>
                {showAddPilotForm ? '✕ סגור' : '+ הוסף טייס'}
              </button>

              {showAddPilotForm && (
                <form onSubmit={addPilot} className="mt-3 bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-4 space-y-3">
                  <h3 className="text-white font-bold">הוספת טייס</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" required value={pilotForm.name}
                      onChange={e => setPilotForm({ ...pilotForm, name: e.target.value })}
                      placeholder="שם" className={inputClass} />
                    <input type="tel" value={pilotForm.phone}
                      onChange={e => setPilotForm({ ...pilotForm, phone: e.target.value })}
                      placeholder="טלפון" className={inputClass} />
                    <input type="text" value={pilotForm.license_number}
                      onChange={e => setPilotForm({ ...pilotForm, license_number: e.target.value })}
                      placeholder="מספר רישיון" className={inputClass} />
                  </div>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium">
                    הוסף טייס
                  </button>
                </form>
              )}
            </div>

            {/* Pilot cards grid */}
            {pilots.length === 0 ? (
              <div className="text-center text-baron-blue-300 py-8">אין טייסים</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pilots.map(p => {
                  const pilotPackages = hourPackages.filter(pkg => pkg.pilot_name === p.name)
                  const totalPurchased = pilotPackages.reduce((sum, pkg) => sum + pkg.hours_purchased, 0)
                  const totalUsed = pilotPackages.reduce((sum, pkg) => sum + pkg.hours_used, 0)
                  const balance = totalPurchased - totalUsed
                  const today = new Date().toISOString().split('T')[0]
                  const futureBookings = bookings.filter(b =>
                    b.pilot_name === p.name && b.date >= today && (b.status === 'pending' || b.status === 'approved')
                  ).length

                  return (
                    <div key={p.id} className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-white font-bold text-lg">{p.name}</h3>
                          {p.phone && <div className="text-baron-blue-300 text-sm">{p.phone}</div>}
                          {p.license_number && <div className="text-baron-blue-400 text-xs">רישיון: {p.license_number}</div>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${p.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {p.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div className="bg-baron-blue-800/50 rounded-lg p-2">
                          <div className={`font-bold ${balance > 0 ? 'text-green-400' : balance === 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {balance} שעות
                          </div>
                          <div className="text-baron-blue-400 text-xs">נותרו מתוך {totalPurchased} שנרכשו</div>
                        </div>
                        <div className="bg-baron-blue-800/50 rounded-lg p-2">
                          <div className="text-white font-bold">{futureBookings}</div>
                          <div className="text-baron-blue-400 text-xs">הזמנות עתידיות</div>
                        </div>
                      </div>

                      <a href={`/admin/pilots/${p.id}`}
                        className="block w-full text-center py-2 rounded-lg bg-baron-blue-600 hover:bg-baron-blue-500 text-white text-sm font-medium transition-colors">
                        פתח כרטיס
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ====== תעריפים TAB ====== */}
        {activeTab === 'תעריפים' && (
          <div className="space-y-4">
            {/* Add rate form */}
            <form onSubmit={addRate} className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-4 space-y-3">
              <h3 className="text-white font-bold">הוספת תעריף</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" required value={rateForm.name}
                  onChange={e => setRateForm({ ...rateForm, name: e.target.value })}
                  placeholder="שם התעריף" className={inputClass} />
                <input type="number" required step="0.01" value={rateForm.rate_per_hour}
                  onChange={e => setRateForm({ ...rateForm, rate_per_hour: e.target.value })}
                  placeholder="מחיר לשעה (₪)" className={inputClass} />
                <input type="text" value={rateForm.description}
                  onChange={e => setRateForm({ ...rateForm, description: e.target.value })}
                  placeholder="תיאור" className={inputClass} />
              </div>
              <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium">
                הוסף תעריף
              </button>
            </form>

            {/* Rates table */}
            <div className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-baron-blue-700/50">
                    <th className="text-baron-blue-200 text-right p-3 font-medium">שם</th>
                    <th className="text-baron-blue-200 text-right p-3 font-medium">מחיר לשעה (₪)</th>
                    <th className="text-baron-blue-200 text-right p-3 font-medium">תיאור</th>
                    <th className="text-baron-blue-200 text-right p-3 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map(r => (
                    <tr key={r.id} className="border-b border-baron-blue-700/30">
                      {editingRateId === r.id ? (
                        <>
                          <td className="p-2"><input type="text" value={editRateForm.name || ''} onChange={e => setEditRateForm({ ...editRateForm, name: e.target.value })} className={inputClass} /></td>
                          <td className="p-2"><input type="number" step="0.01" value={editRateForm.rate_per_hour || ''} onChange={e => setEditRateForm({ ...editRateForm, rate_per_hour: parseFloat(e.target.value) })} className={inputClass} /></td>
                          <td className="p-2"><input type="text" value={editRateForm.description || ''} onChange={e => setEditRateForm({ ...editRateForm, description: e.target.value })} className={inputClass} /></td>
                          <td className="p-2 flex gap-1">
                            <button onClick={() => saveRateEdit(r.id)} className="px-2 py-1 rounded bg-green-600 text-white text-xs">שמור</button>
                            <button onClick={() => setEditingRateId(null)} className="px-2 py-1 rounded bg-baron-blue-700 text-white text-xs">ביטול</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 text-white">{r.name}</td>
                          <td className="p-3 text-white">{r.rate_per_hour}</td>
                          <td className="p-3 text-baron-blue-300">{r.description || '-'}</td>
                          <td className="p-3 flex gap-1">
                            <button onClick={() => { setEditingRateId(r.id); setEditRateForm({ name: r.name, rate_per_hour: r.rate_per_hour, description: r.description }) }}
                              className="px-2 py-1 rounded bg-baron-blue-600 text-white text-xs">ערוך</button>
                            <button onClick={() => deleteRate(r.id)}
                              className="px-2 py-1 rounded bg-red-600 text-white text-xs">מחק</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {rates.length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center text-baron-blue-400">אין תעריפים</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====== בנק שעות TAB ====== */}
        {activeTab === 'בנק שעות' && (
          <div className="space-y-4">
            {/* Add package form */}
            <form onSubmit={addPackage} className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-4 space-y-3">
              <h3 className="text-white font-bold">הוספת חבילת שעות</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" required value={packageForm.pilot_name}
                  onChange={e => setPackageForm({ ...packageForm, pilot_name: e.target.value })}
                  placeholder="שם הטייס" className={inputClass} />
                <input type="number" required step="0.1" value={packageForm.hours_purchased}
                  onChange={e => setPackageForm({ ...packageForm, hours_purchased: e.target.value })}
                  placeholder="שעות שנרכשו" className={inputClass} />
                <input type="number" step="0.01" value={packageForm.price_paid}
                  onChange={e => setPackageForm({ ...packageForm, price_paid: e.target.value })}
                  placeholder="תשלום (₪)" className={inputClass} />
                <input type="date" value={packageForm.purchase_date}
                  onChange={e => setPackageForm({ ...packageForm, purchase_date: e.target.value })}
                  className={inputClass} />
              </div>
              <input type="text" value={packageForm.notes}
                onChange={e => setPackageForm({ ...packageForm, notes: e.target.value })}
                placeholder="הערות" className={inputClass} />
              <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium">
                הוסף חבילה
              </button>
            </form>

            {/* Hour packages table */}
            <div className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-baron-blue-700/50">
                    <th className="text-baron-blue-200 text-right p-3 font-medium">טייס</th>
                    <th className="text-baron-blue-200 text-right p-3 font-medium">שעות שנרכשו</th>
                    <th className="text-baron-blue-200 text-right p-3 font-medium">שעות שנוצלו</th>
                    <th className="text-baron-blue-200 text-right p-3 font-medium">יתרה</th>
                    <th className="text-baron-blue-200 text-right p-3 font-medium">תשלום</th>
                    <th className="text-baron-blue-200 text-right p-3 font-medium">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {hourPackages.map(pkg => {
                    const balance = pkg.hours_purchased - pkg.hours_used
                    return (
                      <tr key={pkg.id} className="border-b border-baron-blue-700/30">
                        <td className="p-3 text-white">{pkg.pilot_name}</td>
                        <td className="p-3 text-white">{pkg.hours_purchased}</td>
                        <td className="p-3 text-white">{pkg.hours_used}</td>
                        <td className={`p-3 font-bold ${balance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {balance}
                        </td>
                        <td className="p-3 text-baron-blue-300">{pkg.price_paid ? `₪${pkg.price_paid}` : '-'}</td>
                        <td className="p-3 text-baron-blue-300">{pkg.purchase_date}</td>
                      </tr>
                    )
                  })}
                  {hourPackages.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-center text-baron-blue-400">אין חבילות שעות</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
