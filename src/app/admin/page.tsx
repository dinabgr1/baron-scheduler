'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import NotificationBanner from '@/components/NotificationBanner'
import WeeklyCalendar from '@/components/WeeklyCalendar'
import { Booking, FlightLog, Pilot, Rate, HourPackage } from '@/lib/db'

type AdminTab = 'הזמנות' | 'טייסים' | 'פיננסים' | 'תחזוקה' | 'דוחות'
const VALID_TABS: AdminTab[] = ['הזמנות', 'טייסים', 'פיננסים', 'תחזוקה', 'דוחות']

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Check existing auth cookie on mount
  useEffect(() => {
    fetch('/api/admin/check').then(res => {
      if (res.ok) setAuthed(true)
    }).finally(() => setCheckingAuth(false))
  }, [])
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

  // Read tab from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab') as AdminTab | null
      if (tab && VALID_TABS.includes(tab)) {
        setActiveTab(tab)
      }
    }
  }, [])
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
  const [packageForm, setPackageForm] = useState({ pilot_name: '', hours_purchased: '', hours_gift: '', price_paid: '', purchase_date: new Date().toISOString().split('T')[0], notes: '' })

  // Maintenance state
  type MaintenanceRecord = {
    id: string; maintenance_type: string; last_done_date: string | null;
    last_done_hobbs: number; interval_hours: number | null; interval_months: number | null; notes: string | null; visible_to_pilots: number;
    interval_type: 'calendar' | 'airtime' | 'fixed_airframe'; last_done_airframe_hours: number | null;
    next_due_airframe_hours: number | null; hobbs_at_maintenance: number | null;
    remaining?: number | null; remainingUnit?: 'hours' | 'days'; percentage?: number;
  }
  type MaintenanceHistoryEntry = { id: string; maintenance_record_id: string; done_date: string; done_airframe_hours: number | null; hobbs_reading: number | null; notes: string | null; created_at: string }
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [currentHobbs, setCurrentHobbs] = useState(0)
  const [totalAirframeHours, setTotalAirframeHours] = useState(0)
  const [editingMaintId, setEditingMaintId] = useState<string | null>(null)
  const [maintEditForm, setMaintEditForm] = useState({ last_done_hobbs: '', last_done_date: '', last_done_airframe_hours: '', hobbs_at_maintenance: '', notes: '' })
  const [showAddMaint, setShowAddMaint] = useState(false)
  const [maintAddForm, setMaintAddForm] = useState({ maintenance_type: '', interval_type: 'airtime' as string, interval_hours: '', interval_months: '', next_due_airframe_hours: '', last_done_hobbs: '', last_done_date: '', last_done_airframe_hours: '', hobbs_at_maintenance: '', notes: '' })
  const [showAirframeToggle, setShowAirframeToggle] = useState(false)
  const [expandedMaintId, setExpandedMaintId] = useState<string | null>(null)
  const [maintHistory, setMaintHistory] = useState<Record<string, MaintenanceHistoryEntry[]>>({})
  const [editingAirframeHours, setEditingAirframeHours] = useState(false)
  const [airframeHoursInput, setAirframeHoursInput] = useState('')

  // Stats
  const [stats, setStats] = useState({ totalBookings: 0, pendingBookings: 0, flightHours: 0, lastHobbs: 0 })

  async function loadMaintenance() {
    const res = await fetch('/api/maintenance')
    const data = await res.json()
    if (data.records) setMaintenanceRecords(data.records)
    if (data.currentHobbs) setCurrentHobbs(data.currentHobbs)
    if (data.totalAirframeHours) setTotalAirframeHours(data.totalAirframeHours)
  }

  async function deleteMaintItem(id: string) {
    if (!confirm('למחוק פריט תחזוקה זה?')) return
    await fetch('/api/maintenance', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadMaintenance()
  }

  async function toggleMaintVisibility(id: string, current: number) {
    await fetch('/api/maintenance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, visible_to_pilots: current ? 0 : 1 }) })
    loadMaintenance()
  }

  async function saveMaintEdit(id: string) {
    const payload: Record<string, unknown> = { id }
    if (maintEditForm.last_done_hobbs) payload.last_done_hobbs = parseFloat(maintEditForm.last_done_hobbs)
    if (maintEditForm.last_done_date) payload.last_done_date = maintEditForm.last_done_date
    if (maintEditForm.last_done_airframe_hours) payload.last_done_airframe_hours = parseFloat(maintEditForm.last_done_airframe_hours)
    if (maintEditForm.hobbs_at_maintenance) payload.hobbs_at_maintenance = parseFloat(maintEditForm.hobbs_at_maintenance)

    await fetch('/api/maintenance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    // Also add to history
    await fetch('/api/maintenance/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maintenance_record_id: id,
        done_date: maintEditForm.last_done_date,
        done_airframe_hours: maintEditForm.last_done_airframe_hours ? parseFloat(maintEditForm.last_done_airframe_hours) : null,
        hobbs_reading: maintEditForm.hobbs_at_maintenance ? parseFloat(maintEditForm.hobbs_at_maintenance) : null,
        notes: maintEditForm.notes || null,
      }),
    })

    setEditingMaintId(null)
    loadMaintenance()
  }

  async function addMaintenanceItem(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maintenance_type: maintAddForm.maintenance_type,
        interval_type: maintAddForm.interval_type,
        interval_hours: maintAddForm.interval_type === 'airtime' ? (parseFloat(maintAddForm.interval_hours) || null) : null,
        interval_months: maintAddForm.interval_type === 'calendar' ? (parseInt(maintAddForm.interval_months) || null) : null,
        next_due_airframe_hours: maintAddForm.interval_type === 'fixed_airframe' ? (parseFloat(maintAddForm.next_due_airframe_hours) || null) : null,
        last_done_hobbs: parseFloat(maintAddForm.last_done_hobbs) || 0,
        last_done_date: maintAddForm.last_done_date || null,
        last_done_airframe_hours: maintAddForm.last_done_airframe_hours ? parseFloat(maintAddForm.last_done_airframe_hours) : null,
        hobbs_at_maintenance: maintAddForm.hobbs_at_maintenance ? parseFloat(maintAddForm.hobbs_at_maintenance) : null,
        notes: maintAddForm.notes || null,
      }),
    })
    setMaintAddForm({ maintenance_type: '', interval_type: 'airtime', interval_hours: '', interval_months: '', next_due_airframe_hours: '', last_done_hobbs: '', last_done_date: '', last_done_airframe_hours: '', hobbs_at_maintenance: '', notes: '' })
    setShowAddMaint(false)
    loadMaintenance()
  }

  async function loadMaintHistory(recordId: string) {
    const res = await fetch(`/api/maintenance/history?record_id=${recordId}`)
    const data = await res.json()
    setMaintHistory(prev => ({ ...prev, [recordId]: data }))
  }

  async function saveAirframeHours() {
    await fetch('/api/aircraft-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'airframe_hours_initial', value: airframeHoursInput }),
    })
    setEditingAirframeHours(false)
    loadMaintenance()
    loadAllData()
  }

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

  async function loadBookings() { await loadAllData() }
  async function loadFlightLogs() { await loadAllData() }

  async function loadAllData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/data')
      const d = await res.json()
      if (d.bookings) setBookings(d.bookings.sort((a: Booking, b: Booking) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date)
        return a.start_time.localeCompare(b.start_time)
      }))
      if (d.flightLogs) setFlightLogs(d.flightLogs)
      if (d.pilots) setPilots(d.pilots)
      if (d.packages) setHourPackages(d.packages)
      if (d.rates) setRates(d.rates)
      if (d.maintenance) {
        setMaintenanceRecords(d.maintenance.records)
        setCurrentHobbs(d.maintenance.currentHobbs)
        if (d.maintenance.totalAirframeHours) setTotalAirframeHours(d.maintenance.totalAirframeHours)
      }
    } catch(e) { console.error(e) }
    setLoading(false)
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
    // rates loaded with פיננסים
    if (activeTab === 'פיננסים') { loadHourPackages(); loadRates() }
    if (activeTab === 'תחזוקה') loadMaintenance()
    if (activeTab === 'דוחות') { loadBookings(); loadFlightLogs(); loadHourPackages(); loadPilots() }
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
    const giftHours = parseFloat(packageForm.hours_gift || '0') || 0
    const totalHours = parseFloat(packageForm.hours_purchased || '0') + giftHours
    const giftNote = giftHours > 0 ? `[gift:${giftHours}] ` : ''
    const finalNotes = (giftNote + (packageForm.notes || '')).trim()
    await fetch('/api/hour-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pilot_name: packageForm.pilot_name,
        hours_purchased: totalHours,
        price_paid: packageForm.price_paid ? parseFloat(packageForm.price_paid) : null,
        purchase_date: packageForm.purchase_date,
        notes: finalNotes || null,
      }),
    })
    setPackageForm({ pilot_name: '', hours_purchased: '', hours_gift: '', price_paid: '', purchase_date: new Date().toISOString().split('T')[0], notes: '' })
    loadHourPackages()
  }

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter)

  const tabs: AdminTab[] = ['הזמנות', 'טייסים', 'פיננסים', 'תחזוקה', 'דוחות']

  const inputClass = "w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"

  if (checkingAuth) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">⏳</p></div>
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-sm mx-auto px-4 py-20 pb-20 md:pb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-gray-900 font-bold text-xl text-center mb-6">כניסת מנהל</h2>
            <form onSubmit={login} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה"
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg text-center"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-colors"
              >
                כניסה
              </button>
              {loginError && (
                <p className="text-red-600 text-center text-sm">{loginError}</p>
              )}
            </form>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">פאנל ניהול</h2>
          <p className="text-gray-500">ניהול הזמנות ונתוני טיסה | Baron 4X-DZJ</p>
          <a href="/admin/login-logs" className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">📋 היסטוריית כניסות →</a>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-md border border-gray-300 p-4 border-l-4 border-l-blue-500">
            <div className="text-3xl font-black text-gray-900">{stats.totalBookings}</div>
            <div className="text-gray-500 uppercase tracking-wide text-xs">סה&quot;כ הזמנות החודש</div>
          </div>
          <div className="bg-white rounded-2xl shadow-md border border-gray-300 p-4 border-l-4 border-l-blue-500">
            <div className="text-3xl font-black text-gray-900">{stats.pendingBookings}</div>
            <div className="text-gray-500 uppercase tracking-wide text-xs">ממתינות לאישור</div>
          </div>
          <div className="bg-white rounded-2xl shadow-md border border-gray-300 p-4 border-l-4 border-l-green-500">
            <div className="text-3xl font-black text-gray-900">{stats.flightHours}</div>
            <div className="text-gray-500 uppercase tracking-wide text-xs">שעות טיסה החודש</div>
          </div>
          <div className="bg-white rounded-2xl shadow-md border border-gray-300 p-4 border-l-4 border-l-green-500">
            <div className="text-3xl font-black text-gray-900">{stats.lastHobbs}</div>
            <div className="text-gray-500 uppercase tracking-wide text-xs">Hobbs אחרון</div>
          </div>
        </div>

        <NotificationBanner />

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1 flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
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
                    view === 'list' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                  רשימה
                </button>
                <button onClick={() => setView('calendar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                  לוח שנה
                </button>
              </div>

              <div className="flex gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
                  showAddForm ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}>
                {showAddForm ? '✕ סגור' : '+ הוסף הזמנה'}
              </button>

              {showAddForm && (
                <form onSubmit={createAdminBooking} className="mt-3 bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                  <h3 className="text-gray-900 font-bold text-lg">הוספת הזמנה (מנהל)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">שם הטייס</label>
                      <input type="text" required value={addForm.pilot_name}
                        onChange={e => setAddForm({ ...addForm, pilot_name: e.target.value })}
                        placeholder="שם מלא" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">תאריך</label>
                      <input type="date" required value={addForm.date}
                        onChange={e => setAddForm({ ...addForm, date: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">שעת התחלה</label>
                      <input type="time" required value={addForm.start_time}
                        onChange={e => setAddForm({ ...addForm, start_time: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">שעת סיום</label>
                      <input type="time" required value={addForm.end_time}
                        onChange={e => setAddForm({ ...addForm, end_time: e.target.value })}
                        className={inputClass} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={addForm.with_instructor}
                        onChange={e => setAddForm({ ...addForm, with_instructor: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <span className="text-gray-700 text-sm">עם מדריך</span>
                    </label>
                    {addForm.with_instructor && (
                      <select value={addForm.instructor_name}
                        onChange={e => setAddForm({ ...addForm, instructor_name: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500">
                        <option value="Shani Segev">שני שגיב</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1">סטטוס</label>
                    <div className="flex gap-2">
                      {([
                        { value: 'approved', label: 'מאושר', color: 'bg-green-600 hover:bg-green-700' },
                        { value: 'pending', label: 'ממתין', color: 'bg-yellow-500 hover:bg-yellow-600' },
                        { value: 'rejected', label: 'נדחה', color: 'bg-red-600 hover:bg-red-700' },
                      ] as const).map(s => (
                        <button key={s.value} type="button"
                          onClick={() => setAddForm({ ...addForm, status: s.value })}
                          className={`px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors ${
                            addForm.status === s.value ? s.color + ' ring-2 ring-offset-1 ring-blue-400' : 'bg-gray-200 text-gray-600'
                          }`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={addSubmitting}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold text-base transition-colors">
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
                  <div className="text-center text-gray-500 py-8">טוען...</div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">אין הזמנות</div>
                ) : (
                  filteredBookings.map((b) => {
                    const flightLog = getFlightLogForBooking(b.id)
                    const isEditing = editingId === b.id

                    return (
                      <div key={b.id} className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 pl-4 border-l-4 ${b.status === 'approved' ? 'border-l-green-500' : b.status === 'pending' ? 'border-l-yellow-400' : 'border-l-red-500'}`}>
                        <div className="flex flex-wrap gap-4 justify-between items-start">
                          <div className="flex-1 min-w-[200px]">
                            {isEditing ? (
                              <div className="space-y-2">
                                <input type="text" value={editForm.pilot_name || ''}
                                  onChange={(e) => setEditForm({ ...editForm, pilot_name: e.target.value })}
                                  className="w-full px-3 py-2 rounded bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500" />
                                <div className="grid grid-cols-3 gap-2">
                                  <input type="date" value={editForm.date || ''}
                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                    className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500" />
                                  <input type="time" value={editForm.start_time || ''}
                                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                    className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500" />
                                  <input type="time" value={editForm.end_time || ''}
                                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                    className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => saveEdit(b.id)}
                                    className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm">שמור</button>
                                  <button onClick={() => setEditingId(null)}
                                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm">ביטול</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl font-bold text-gray-900">{b.pilot_name}</span>
                                  {(() => {
                                    const matchedPilot = pilots.find(p => p.name === b.pilot_name)
                                    return matchedPilot ? (
                                      <a href={`/admin/pilots/${matchedPilot.id}`} className="text-blue-600 hover:text-blue-800 transition-colors" title="כרטיס טייס">👤</a>
                                    ) : null
                                  })()}
                                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    b.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {b.status === 'approved' ? 'מאושר' : b.status === 'pending' ? 'ממתין' : 'נדחה'}
                                  </span>
                                </div>
                                <div className="text-base text-gray-700 font-medium space-y-0.5">
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
                                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors">
                                    אשר
                                  </button>
                                  <button onClick={() => updateBookingStatus(b.id, 'rejected')}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                                    דחה
                                  </button>
                                </>
                              )}
                              <button onClick={() => startEdit(b)}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                                ערוך
                              </button>
                              <button onClick={() => deleteBooking(b.id)}
                                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-600 text-sm font-medium transition-colors">
                                מחק
                              </button>
                              {flightLog && (
                                <button onClick={() => setSelectedFlightLog(selectedFlightLog === b.id ? null : b.id)}
                                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-sm font-medium transition-colors">
                                  נתוני טיסה
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {selectedFlightLog === b.id && flightLog && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-gray-700 font-medium text-sm mb-2">נתוני טיסה</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Hobbs:</span>
                                <span className="text-gray-900 mr-1">{flightLog.hobbs_start} → {flightLog.hobbs_end}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">זמן טיסה:</span>
                                <span className="text-gray-900 mr-1">{flightLog.flight_time_hours}:{String(flightLog.flight_time_minutes).padStart(2, '0')}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">דלק שהוסף:</span>
                                <span className="text-gray-900 mr-1">{flightLog.fuel_added_liters}L</span>
                              </div>
                              <div>
                                <span className="text-gray-500">מפלס דלק:</span>
                                <span className="text-gray-900 mr-1">{flightLog.fuel_level_quarters}/4</span>
                              </div>
                              <div>
                                <span className="text-gray-500">שמן מנוע 1:</span>
                                <span className="text-gray-900 mr-1">{flightLog.oil_engine1}qt</span>
                              </div>
                              <div>
                                <span className="text-gray-500">שמן מנוע 2:</span>
                                <span className="text-gray-900 mr-1">{flightLog.oil_engine2}qt</span>
                              </div>
                              {flightLog.notes && (
                                <div className="col-span-2">
                                  <span className="text-gray-500">הערות:</span>
                                  <span className="text-gray-900 mr-1">{flightLog.notes}</span>
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
                  showAddPilotForm ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}>
                {showAddPilotForm ? '✕ סגור' : '+ הוסף טייס'}
              </button>

              {showAddPilotForm && (
                <form onSubmit={addPilot} className="mt-3 bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                  <h3 className="text-gray-900 font-bold">הוספת טייס</h3>
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
                  <button type="submit" className="px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-base font-bold">
                    הוסף טייס
                  </button>
                </form>
              )}
            </div>

            {/* Pilot cards grid */}
            {pilots.length === 0 ? (
              <div className="text-center text-gray-500 py-8">אין טייסים</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pilots.map(p => {
                  const pilotPackages = hourPackages.filter(pkg => pkg.pilot_name === p.name)
                  const totalPurchased = pilotPackages.reduce((sum, pkg) => sum + pkg.hours_purchased, 0)
                  const today = new Date().toISOString().split('T')[0]
                  const futureBookings = bookings.filter(b =>
                    b.pilot_name === p.name && b.date >= today && (b.status === 'pending' || b.status === 'approved')
                  ).length
                  const pilotPastBookings = bookings.filter(b => b.pilot_name === p.name && b.date < today)
                  const pilotReportedIds = new Set(flightLogs.filter(l =>
                    pilotPastBookings.some(b => b.id === l.booking_id)
                  ).map(l => l.booking_id))
                  const unreportedCount = pilotPastBookings.filter(b => !pilotReportedIds.has(b.id)).length
                  const pilotFlightHours = flightLogs.filter(l =>
                    pilotPastBookings.some(b => b.id === l.booking_id)
                  ).reduce((sum, log) => {
                    if (log.hobbs_end && log.hobbs_start) return sum + (log.hobbs_end - log.hobbs_start)
                    return sum + (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
                  }, 0)
                  const balance = totalPurchased - pilotFlightHours

                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                          {p.phone && <div className="text-gray-500 text-sm">{p.phone}</div>}
                          {p.license_number && <div className="text-gray-400 text-xs">רישיון: {p.license_number}</div>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className={`text-2xl font-black ${balance > 0 ? 'text-green-600' : balance === 0 ? 'text-orange-600' : 'text-red-600'}`}>
                            {Math.round(balance * 10) / 10} שעות
                          </div>
                          <div className="text-gray-500 text-xs">נותרו מתוך {totalPurchased} שנרכשו</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-gray-900 font-bold">{futureBookings}</div>
                          <div className="text-gray-500 text-xs">הזמנות עתידיות</div>
                        </div>
                        {unreportedCount > 0 && (
                          <div className="col-span-2 bg-orange-50 border border-orange-300 rounded-lg p-2 flex items-center gap-2">
                            <span>⚠️</span>
                            <div>
                              <div className="text-orange-700 font-bold text-xs">{unreportedCount} טיסות ללא דיווח</div>
                              <div className="text-orange-600 text-xs">חישוב שעות עלול להיות שגוי</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <a href={`/admin/pilots/${p.id}`}
                        className="block w-full text-center py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
                        פתח כרטיס
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ====== פיננסים TAB ====== */}
        {activeTab === 'פיננסים' && (() => {
          // Build per-pilot financial summary
          const pilotNamesSet = new Set([...pilots.map(p => p.name), ...hourPackages.map(p => p.pilot_name)])
          const pilotNames = Array.from(pilotNamesSet)
          const defaultRate = rates[0]?.rate_per_hour || 0
          return (
            <div className="space-y-3">
              <h3 className="text-gray-700 font-semibold text-sm">📊 סיכום כלכלי לפי טייס</h3>
              {pilotNames.map(name => {
                const pilotBookings = bookings.filter(b => b.pilot_name === name)
                const pilotLogs = flightLogs.filter(l => pilotBookings.some(b => b.id === l.booking_id))
                const hoursFlown = pilotLogs.reduce((sum, log) => {
                  const hrs = log.hobbs_end && log.hobbs_start
                    ? log.hobbs_end - log.hobbs_start
                    : (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
                  return sum + hrs
                }, 0)
                const pkgs = hourPackages.filter(p => p.pilot_name === name)
                const totalPurchased = pkgs.reduce((s, p) => s + p.hours_purchased, 0)
                const totalPaid = pkgs.reduce((s, p) => s + (p.price_paid || 0), 0)
                const hoursRemaining = Math.round((totalPurchased - hoursFlown) * 10) / 10
                const costByRate = Math.round(hoursFlown * defaultRate)
                const debt = Math.max(0, costByRate - totalPaid)
                const unreported = pilotBookings.filter(b => {
                  const today = new Date().toISOString().split('T')[0]
                  return b.date < today && !flightLogs.some(l => l.booking_id === b.id)
                }).length
                return (
                  <div key={name} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-gray-900 text-base">{name}</h4>
                      {debt > 0
                        ? <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">חוב: ₪{debt.toLocaleString()}</span>
                        : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">מעודכן ✓</span>
                      }
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-bold text-gray-900">{Math.round(hoursFlown * 10) / 10}h</div>
                        <div className="text-xs text-gray-500">שעות שנטסו</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-bold text-gray-900">{totalPurchased}h</div>
                        <div className="text-xs text-gray-500">שעות שנרכשו</div>
                      </div>
                      <div className={`rounded-lg p-2 ${hoursRemaining >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className={`font-bold ${hoursRemaining >= 0 ? 'text-green-700' : 'text-red-700'}`}>{hoursRemaining}h</div>
                        <div className="text-xs text-gray-500">יתרה</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-bold text-gray-900">₪{totalPaid.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">סה"כ שולם</div>
                      </div>
                    </div>
                    {unreported > 0 && (
                      <div className="mt-2 text-xs text-orange-700 bg-orange-50 rounded px-2 py-1">
                        ⚠️ {unreported} טיסות ללא דיווח — יתרה עלולה להיות שגויה
                      </div>
                    )}
                    {defaultRate > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        עלות מחושבת: {Math.round(hoursFlown * 10) / 10}h × ₪{defaultRate.toLocaleString()} = ₪{costByRate.toLocaleString()} | שולם: ₪{totalPaid.toLocaleString()}
                      </div>
                    )}
                  </div>
                )
              })}
              {pilotNames.length === 0 && <p className="text-gray-500 text-center py-4">אין טייסים</p>}

              {/* Divider + Add package */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-gray-700 font-semibold text-sm">💼 הוספת רכישת שעות</h3>
                  {rates.length > 0 && <span className="text-xs text-gray-500">תעריף: ₪{rates[0]?.rate_per_hour?.toLocaleString()}/שעה</span>}
                </div>
                <form onSubmit={addPackage} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">שם הטייס</label>
                      <select value={packageForm.pilot_name}
                        onChange={e => setPackageForm({ ...packageForm, pilot_name: e.target.value })}
                        className={inputClass} required>
                        <option value="">בחר טייס...</option>
                        {pilots.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">תעריף</label>
                      <select className={inputClass}
                        onChange={e => {
                          const rate = rates.find(r => String(r.id) === e.target.value)
                          if (rate && packageForm.hours_purchased) {
                            setPackageForm(f => ({ ...f, price_paid: String(Math.round(parseFloat(f.hours_purchased) * rate.rate_per_hour)) }))
                          }
                        }}>
                        <option value="">בחר תעריף...</option>
                        {rates.map(r => <option key={r.id} value={r.id}>{r.name} — ₪{r.rate_per_hour?.toLocaleString()}/שעה</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">מספר שעות</label>
                      <input type="number" required step="0.1" value={packageForm.hours_purchased}
                        onChange={e => {
                          const hrs = e.target.value
                          setPackageForm(f => {
                            const currentRate = rates[0]?.rate_per_hour
                            const auto = currentRate && hrs ? String(Math.round(parseFloat(hrs) * currentRate)) : f.price_paid
                            return { ...f, hours_purchased: hrs, price_paid: auto }
                          })
                        }}
                        placeholder="0" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">סכום לתשלום (₪)</label>
                      <input type="number" step="0.01" value={packageForm.price_paid}
                        onChange={e => setPackageForm({ ...packageForm, price_paid: e.target.value })}
                        placeholder="מחושב אוטומטית" className={inputClass + ' bg-blue-50'} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">שעות מתנה 🎁 <span className="text-gray-400 font-normal">(אופציונלי)</span></label>
                      <input type="number" step="0.1" min="0" value={packageForm.hours_gift}
                        onChange={e => setPackageForm({ ...packageForm, hours_gift: e.target.value })}
                        placeholder="0" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">תאריך רכישה</label>
                      <input type="date" value={packageForm.purchase_date}
                        onChange={e => setPackageForm({ ...packageForm, purchase_date: e.target.value })}
                        className={inputClass} />
                    </div>
                  </div>
                  {packageForm.hours_purchased && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800 space-y-0.5">
                      {packageForm.price_paid && <div>💰 {packageForm.hours_purchased} שעות × ₪{rates[0]?.rate_per_hour?.toLocaleString() || '?'} = <strong>₪{packageForm.price_paid}</strong></div>}
                      {parseFloat(packageForm.hours_gift || '0') > 0 && (
                        <div className="text-green-700">🎁 + {packageForm.hours_gift} שעות מתנה | סה"כ: <strong>{(parseFloat(packageForm.hours_purchased||'0') + parseFloat(packageForm.hours_gift||'0'))} שעות</strong></div>
                      )}
                    </div>
                  )}
                  <button type="submit" className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold">
                    + הוסף רכישת שעות
                  </button>
                </form>
              </div>

              {/* Rate management */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <h3 className="text-gray-700 font-semibold text-sm">⚙️ ניהול תעריפים</h3>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right py-2 px-3">שם</th>
                        <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right py-2 px-3">₪/שעה</th>
                        <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right py-2 px-3">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.map(r => (
                        <tr key={r.id} className="border-b border-gray-100">
                          {editingRateId === r.id ? (
                            <>
                              <td className="p-2"><input type="text" value={editRateForm.name || ''} onChange={e => setEditRateForm({ ...editRateForm, name: e.target.value })} className={inputClass} /></td>
                              <td className="p-2"><input type="number" step="0.01" value={editRateForm.rate_per_hour || ''} onChange={e => setEditRateForm({ ...editRateForm, rate_per_hour: parseFloat(e.target.value) })} className={inputClass} /></td>
                              <td className="p-2 flex gap-1">
                                <button onClick={() => saveRateEdit(r.id)} className="px-2 py-1 rounded bg-green-600 text-white text-xs">שמור</button>
                                <button onClick={() => setEditingRateId(null)} className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs">ביטול</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-3 text-gray-900 font-medium">{r.name}</td>
                              <td className="py-2 px-3 text-gray-900">₪{r.rate_per_hour?.toLocaleString()}</td>
                              <td className="py-2 px-3 flex gap-1">
                                <button onClick={() => { setEditingRateId(r.id); setEditRateForm({ name: r.name, rate_per_hour: r.rate_per_hour, description: r.description }) }}
                                  className="px-2 py-1 rounded bg-blue-600 text-white text-xs">ערוך</button>
                                <button onClick={() => deleteRate(r.id)}
                                  className="px-2 py-1 rounded bg-red-600 text-white text-xs">מחק</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {rates.length === 0 && <tr><td colSpan={3} className="p-3 text-center text-gray-500 text-xs">אין תעריפים</td></tr>}
                    </tbody>
                  </table>
                </div>
                <form onSubmit={addRate} className="flex gap-2 flex-wrap">
                  <input type="text" required value={rateForm.name} onChange={e => setRateForm({ ...rateForm, name: e.target.value })} placeholder="שם תעריף" className={inputClass + ' flex-1 min-w-24'} />
                  <input type="number" required step="0.01" value={rateForm.rate_per_hour} onChange={e => setRateForm({ ...rateForm, rate_per_hour: e.target.value })} placeholder="₪/שעה" className={inputClass + ' w-28'} />
                  <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">+ הוסף</button>
                </form>
              </div>
            </div>
          )
        })()}
        {/* ====== תחזוקה TAB ====== */}
        {activeTab === 'תחזוקה' && (
          <div className="space-y-4">
            {/* Airframe Hours + Hobbs display */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-gray-500 text-sm mb-1">Hobbs נוכחי</div>
                  <div className="text-4xl font-black text-gray-900">{currentHobbs}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm mb-1">שעות גוף נוכחיות</div>
                  {editingAirframeHours ? (
                    <div className="flex items-center justify-center gap-2">
                      <input type="number" step="0.1" value={airframeHoursInput}
                        onChange={e => setAirframeHoursInput(e.target.value)}
                        className={inputClass + ' w-28 text-center'} placeholder="שעות בסיס" />
                      <button onClick={saveAirframeHours} className="px-2 py-1 rounded bg-green-600 text-white text-xs">שמור</button>
                      <button onClick={() => setEditingAirframeHours(false)} className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs">ביטול</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-black text-gray-900">{Math.round(totalAirframeHours * 10) / 10}</span>
                      <button onClick={() => { setEditingAirframeHours(true); setAirframeHoursInput(String(Math.round(totalAirframeHours * 10) / 10)) }}
                        className="text-blue-500 hover:text-blue-700 text-sm">✏️</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Toggle display mode */}
            <div className="flex justify-end">
              <button onClick={() => setShowAirframeToggle(!showAirframeToggle)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors border border-gray-200">
                {showAirframeToggle ? 'שעות שנותרו' : 'שעות גוף'}
              </button>
            </div>

            {/* Maintenance records */}
            <div className="space-y-3">
              {maintenanceRecords.map(rec => {
                const intervalType = rec.interval_type || 'airtime'
                const remaining = rec.remaining ?? 0
                const pct = rec.percentage ?? 0
                const typeIcon = intervalType === 'calendar' ? '\u{1F4C5}' : intervalType === 'fixed_airframe' ? '\u{1F527}' : '\u{23F1}'

                let colorClass = 'text-green-600'
                let barColor = 'bg-green-500'
                if (pct >= 90 || remaining !== null && remaining <= 0) { colorClass = 'text-red-600'; barColor = 'bg-red-500' }
                else if (pct >= 75) { colorClass = 'text-orange-600'; barColor = 'bg-orange-400' }

                const isEditing = editingMaintId === rec.id
                const isExpanded = expandedMaintId === rec.id

                const displayRemaining = () => {
                  if (showAirframeToggle && intervalType === 'fixed_airframe') {
                    return `${rec.next_due_airframe_hours || 0}h גוף`
                  }
                  if (remaining === null) return '-'
                  if (rec.remainingUnit === 'days') {
                    const days = remaining
                    if (days > 60) return `${Math.round(days / 30.44)} חודשים`
                    return `${days} ימים`
                  }
                  return `${remaining}h`
                }

                const intervalLabel = () => {
                  if (intervalType === 'calendar') return `כל ${rec.interval_months} חודשים`
                  if (intervalType === 'fixed_airframe') return `עד ${rec.next_due_airframe_hours}h גוף`
                  return `כל ${rec.interval_hours}h`
                }

                return (
                  <div key={rec.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{typeIcon}</span>
                        <div>
                          <div className="text-gray-900 font-bold">{rec.notes || rec.maintenance_type}</div>
                          <div className="text-gray-500 text-xs">
                            {rec.last_done_date && `ביצוע אחרון: ${rec.last_done_date}`}
                            {rec.last_done_hobbs > 0 && ` | Hobbs: ${rec.last_done_hobbs}`}
                            {rec.last_done_airframe_hours && ` | גוף: ${rec.last_done_airframe_hours}h`}
                          </div>
                        </div>
                      </div>
                      <span className={`font-bold text-lg ${colorClass}`}>
                        {displayRemaining()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{intervalLabel()}</span>
                      {intervalType === 'airtime' && rec.interval_hours && <span>ביקורת ב-{(rec.last_done_hobbs || 0) + rec.interval_hours}h</span>}
                      {intervalType === 'fixed_airframe' && <span>גוף נוכחי: {Math.round(totalAirframeHours * 10) / 10}h</span>}
                    </div>

                    {isEditing ? (
                      <div className="border-t border-gray-200 pt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">Hobbs בביצוע</label>
                            <input type="number" step="0.1" value={maintEditForm.last_done_hobbs}
                              onChange={e => setMaintEditForm({ ...maintEditForm, last_done_hobbs: e.target.value })}
                              className={inputClass} />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">תאריך ביצוע</label>
                            <input type="date" value={maintEditForm.last_done_date}
                              onChange={e => setMaintEditForm({ ...maintEditForm, last_done_date: e.target.value })}
                              className={inputClass} />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">שעות גוף בביצוע</label>
                            <input type="number" step="0.1" value={maintEditForm.last_done_airframe_hours}
                              onChange={e => setMaintEditForm({ ...maintEditForm, last_done_airframe_hours: e.target.value })}
                              className={inputClass} />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1">הערות</label>
                            <input type="text" value={maintEditForm.notes}
                              onChange={e => setMaintEditForm({ ...maintEditForm, notes: e.target.value })}
                              className={inputClass} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveMaintEdit(rec.id)}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium">שמור</button>
                          <button onClick={() => setEditingMaintId(null)}
                            className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">ביטול</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={() => {
                          setEditingMaintId(rec.id)
                          setMaintEditForm({
                            last_done_hobbs: String(currentHobbs),
                            last_done_date: new Date().toISOString().split('T')[0],
                            last_done_airframe_hours: String(Math.round(totalAirframeHours * 10) / 10),
                            hobbs_at_maintenance: String(currentHobbs),
                            notes: '',
                          })
                        }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                          ✏️ עדכן תחזוקה
                        </button>
                        <button onClick={() => {
                          if (isExpanded) { setExpandedMaintId(null) }
                          else { setExpandedMaintId(rec.id); loadMaintHistory(rec.id) }
                        }} className="text-purple-600 hover:text-purple-800 text-xs font-medium">
                          {isExpanded ? '▲ סגור היסטוריה' : '▼ היסטוריה'}
                        </button>
                        <button onClick={() => toggleMaintVisibility(rec.id, rec.visible_to_pilots)}
                          className={`text-xs font-medium ${rec.visible_to_pilots ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}>
                          {rec.visible_to_pilots ? '👁️ מוצג' : '🚫 מוסתר'}
                        </button>
                        <button onClick={() => deleteMaintItem(rec.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium">
                          🗑️ מחק
                        </button>
                      </div>
                    )}

                    {/* History expansion */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 pt-3">
                        <div className="text-xs font-semibold text-gray-600 mb-2">היסטוריית ביקורות</div>
                        {maintHistory[rec.id] && maintHistory[rec.id].length > 0 ? (
                          <div className="space-y-2">
                            {maintHistory[rec.id].map(h => (
                              <div key={h.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="font-medium">{h.done_date}</span>
                                  <span className="text-gray-500">
                                    {h.hobbs_reading && `Hobbs: ${h.hobbs_reading}`}
                                    {h.done_airframe_hours && ` | גוף: ${h.done_airframe_hours}h`}
                                  </span>
                                </div>
                                {h.notes && <div className="text-gray-600 mt-1">{h.notes}</div>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">אין היסטוריה</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add maintenance form */}
            <div>
              <button onClick={() => setShowAddMaint(!showAddMaint)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showAddMaint ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}>
                {showAddMaint ? '✕ סגור' : '+ הוסף ביקורת'}
              </button>

              {showAddMaint && (
                <form onSubmit={addMaintenanceItem} className="mt-3 bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "החלפת שמן", type: "oil_change", itype: "airtime", hrs: "50", months: "", nxt: "", notes: "החלפת שמן" },
                      { label: "ביקורת 100h", type: "100hr", itype: "airtime", hrs: "100", months: "", nxt: "", notes: "ביקורת 100 שעות" },
                      { label: "שנתית", type: "annual", itype: "calendar", hrs: "", months: "12", nxt: "", notes: "ביקורת שנתית" },
                      { label: "מד גובה", type: "altimeter", itype: "calendar", hrs: "", months: "24", nxt: "", notes: "בדיקת מד גובה + טרנספונדר" },
                      { label: "ELT", type: "elt", itype: "calendar", hrs: "", months: "12", nxt: "", notes: "בדיקת ELT" },
                    ].map(p => (
                      <button key={p.type} type="button" onClick={() => setMaintAddForm({
                        maintenance_type: p.type, interval_type: p.itype, interval_hours: p.hrs, interval_months: p.months,
                        next_due_airframe_hours: p.nxt,
                        last_done_hobbs: String(currentHobbs), last_done_date: new Date().toISOString().split("T")[0],
                        last_done_airframe_hours: String(Math.round(totalAirframeHours * 10) / 10),
                        hobbs_at_maintenance: String(currentHobbs),
                        notes: p.notes
                      })}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 hover:bg-blue-100 transition-colors">
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">שם הביקורת</label>
                      <input type="text" required value={maintAddForm.maintenance_type}
                        onChange={e => setMaintAddForm({ ...maintAddForm, maintenance_type: e.target.value })}
                        placeholder="לדוגמה: החלפת שמן" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">סוג</label>
                      <select value={maintAddForm.interval_type}
                        onChange={e => setMaintAddForm({ ...maintAddForm, interval_type: e.target.value })}
                        className={inputClass}>
                        <option value="airtime">לפי זמן אוויר</option>
                        <option value="calendar">לפי ימים</option>
                        <option value="fixed_airframe">לפי שעות גוף</option>
                      </select>
                    </div>
                    {maintAddForm.interval_type === 'airtime' && (
                      <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1">מרווח שעות</label>
                        <input type="number" step="0.1" value={maintAddForm.interval_hours}
                          onChange={e => setMaintAddForm({ ...maintAddForm, interval_hours: e.target.value })}
                          placeholder="50" className={inputClass} />
                      </div>
                    )}
                    {maintAddForm.interval_type === 'calendar' && (
                      <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1">מרווח חודשים</label>
                        <input type="number" value={maintAddForm.interval_months}
                          onChange={e => setMaintAddForm({ ...maintAddForm, interval_months: e.target.value })}
                          placeholder="12" className={inputClass} />
                      </div>
                    )}
                    {maintAddForm.interval_type === 'fixed_airframe' && (
                      <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1">שעות גוף יעד</label>
                        <input type="number" step="0.1" value={maintAddForm.next_due_airframe_hours}
                          onChange={e => setMaintAddForm({ ...maintAddForm, next_due_airframe_hours: e.target.value })}
                          placeholder="2000" className={inputClass} />
                      </div>
                    )}
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">תאריך ביצוע אחרון</label>
                      <input type="date" value={maintAddForm.last_done_date}
                        onChange={e => setMaintAddForm({ ...maintAddForm, last_done_date: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">Hobbs בביצוע</label>
                      <input type="number" step="0.1" value={maintAddForm.last_done_hobbs}
                        onChange={e => setMaintAddForm({ ...maintAddForm, last_done_hobbs: e.target.value })}
                        placeholder={String(currentHobbs)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">שעות גוף בביצוע</label>
                      <input type="number" step="0.1" value={maintAddForm.last_done_airframe_hours}
                        onChange={e => setMaintAddForm({ ...maintAddForm, last_done_airframe_hours: e.target.value })}
                        placeholder={String(Math.round(totalAirframeHours * 10) / 10)} className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 text-xs font-semibold mb-1">הערות</label>
                      <input type="text" value={maintAddForm.notes}
                        onChange={e => setMaintAddForm({ ...maintAddForm, notes: e.target.value })}
                        placeholder="תיאור הפריט" className={inputClass} />
                    </div>
                  </div>
                  <button type="submit" className="px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold">
                    הוסף ביקורת
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ====== דוחות TAB ====== */}
        {activeTab === 'דוחות' && (() => {
          const now = new Date()
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
          const monthBookings = bookings.filter(b => b.date.startsWith(currentMonth))
          const monthFlightLogs = flightLogs.filter(log => {
            const booking = bookings.find(b => b.id === log.booking_id)
            return booking && booking.date.startsWith(currentMonth)
          })
          const monthHours = monthFlightLogs.reduce((sum, log) => {
            if (log.hobbs_end && log.hobbs_start) return sum + (log.hobbs_end - log.hobbs_start)
            return sum + (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
          }, 0)
          const avgDuration = monthFlightLogs.length > 0 ? monthHours / monthFlightLogs.length : 0

          const monthPackages = hourPackages.filter(p => p.purchase_date.startsWith(currentMonth))
          const monthRevenue = monthPackages.reduce((sum, p) => sum + (p.price_paid || 0), 0)

          const defaultRate = rates.length > 0 ? rates[0].rate_per_hour : 0

          return (
            <div className="space-y-4">
              <h3 className="text-gray-900 font-bold text-lg">📊 דוח חודשי — {now.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</h3>

              {/* Aircraft utilization */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-gray-700 font-semibold text-sm mb-3">🛩️ ניצולת מטוס</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-3xl font-black text-gray-900">{Math.round(monthHours * 10) / 10}</div>
                    <div className="text-xs text-gray-500">שעות טיסה</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-3xl font-black text-gray-900">{monthFlightLogs.length}</div>
                    <div className="text-xs text-gray-500">טיסות</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-3xl font-black text-gray-900">{Math.round(avgDuration * 10) / 10}</div>
                    <div className="text-xs text-gray-500">ממוצע טיסה (h)</div>
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-gray-700 font-semibold text-sm mb-3">💰 הכנסות</h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-3xl font-black text-green-700">₪{monthRevenue.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">שולם החודש</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-3xl font-black text-gray-900">{monthPackages.length}</div>
                    <div className="text-xs text-gray-500">רכישות חבילות</div>
                  </div>
                </div>
              </div>

              {/* Per-pilot breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-gray-700 font-semibold text-sm mb-3">👥 פילוח לפי טייס</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right py-2 px-3">טייס</th>
                        <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right py-2 px-3">טיסות</th>
                        <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right py-2 px-3">שעות</th>
                        <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right py-2 px-3">עלות</th>
                        <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right py-2 px-3">שולם</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pilots.map(p => {
                        const pilotMonthBookings = monthBookings.filter(b => b.pilot_name === p.name)
                        if (pilotMonthBookings.length === 0) return null
                        const pilotMonthLogs = monthFlightLogs.filter(l => pilotMonthBookings.some(b => b.id === l.booking_id))
                        const pilotHours = pilotMonthLogs.reduce((sum, log) => {
                          if (log.hobbs_end && log.hobbs_start) return sum + (log.hobbs_end - log.hobbs_start)
                          return sum + (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
                        }, 0)
                        const pilotCost = Math.round(pilotHours * defaultRate)
                        const pilotPaid = monthPackages.filter(pkg => pkg.pilot_name === p.name).reduce((s, pkg) => s + (pkg.price_paid || 0), 0)
                        return (
                          <tr key={p.id} className="border-b border-gray-100 even:bg-gray-50">
                            <td className="py-2 px-3 text-gray-900 font-medium">{p.name}</td>
                            <td className="py-2 px-3 text-gray-700">{pilotMonthBookings.length}</td>
                            <td className="py-2 px-3 text-gray-700">{Math.round(pilotHours * 10) / 10}</td>
                            <td className="py-2 px-3 text-gray-700">₪{pilotCost.toLocaleString()}</td>
                            <td className="py-2 px-3 text-gray-700">₪{pilotPaid.toLocaleString()}</td>
                          </tr>
                        )
                      }).filter(Boolean)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })()}

      </main>
    </div>
  )
}