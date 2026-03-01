'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import { Pilot, Booking, FlightLog, HourPackage, BillingRecord, Rate } from '@/lib/supabase'

type BillingTab = 'שעות'
type FlightTab = 'טיסות עתידיות' | 'טיסות שעברו'

export default function PilotDetailPage() {
  const params = useParams()
  const pilotId = params.id as string

  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [pilot, setPilot] = useState<Pilot | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [flightLogs, setFlightLogs] = useState<(FlightLog & { bookings?: Booking })[]>([])
  const [packages, setPackages] = useState<HourPackage[]>([])
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([])
  const [rates, setRates] = useState<Rate[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [billingTab, setBillingTab] = useState<BillingTab>('שעות')
  const [flightTab, setFlightTab] = useState<FlightTab>('טיסות עתידיות')

  // Edit pilot state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', license_number: '', email: '' })

  // Add package form
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [packageForm, setPackageForm] = useState({ hours_purchased: '', price_paid: '', purchase_date: new Date().toISOString().split('T')[0], notes: '', purchase_type: 'package' as 'package' | 'individual' })

  // Add billing form
  const [showBillingForm, setShowBillingForm] = useState(false)
  const [billingForm, setBillingForm] = useState({ flight_date: '', hours_flown: '', rate_per_hour: '', notes: '' })

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
    } else {
      setLoginError('סיסמה שגויה')
    }
  }

  useEffect(() => {
    fetch('/api/admin/check').then(res => {
      if (res.ok) setAuthed(true)
    })
  }, [])

  const loadPilot = useCallback(async () => {
    const res = await fetch(`/api/pilots/${pilotId}`)
    if (!res.ok) { setError('טייס לא נמצא'); setLoading(false); return null }
    const listRes = await fetch('/api/pilots')
    const allPilots = await listRes.json()
    const found = Array.isArray(allPilots) ? allPilots.find((p: Pilot) => p.id === pilotId) : null
    if (!found) { setError('טייס לא נמצא'); setLoading(false); return null }
    setPilot(found)
    return found
  }, [pilotId])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [bookingsRes, logsRes, packagesRes, billingRes, ratesRes] = await Promise.all([
        fetch(`/api/pilots/${pilotId}/bookings`),
        fetch(`/api/pilots/${pilotId}/flight-logs`),
        fetch(`/api/pilots/${pilotId}/packages`),
        fetch(`/api/pilots/${pilotId}/billing`),
        fetch('/api/rates'),
      ])

      const [bookingsData, logsData, packagesData, billingData, ratesData] = await Promise.all([
        bookingsRes.json(),
        logsRes.json(),
        packagesRes.json(),
        billingRes.json(),
        ratesRes.json(),
      ])

      if (Array.isArray(bookingsData)) setBookings(bookingsData)
      if (Array.isArray(logsData)) setFlightLogs(logsData)
      if (Array.isArray(packagesData)) setPackages(packagesData)
      if (Array.isArray(billingData)) setBillingRecords(billingData)
      if (Array.isArray(ratesData)) setRates(ratesData)
    } catch {
      setError('שגיאה בטעינת נתונים')
    }
    setLoading(false)
  }, [pilotId])

  useEffect(() => {
    if (!authed) return
    loadPilot()
    loadData()
  }, [authed, loadPilot, loadData])

  // Computed values
  const today = new Date().toISOString().split('T')[0]
  const futureBookings = bookings.filter(b => b.date >= today && (b.status === 'pending' || b.status === 'approved'))
  const pastBookings = bookings.filter(b => b.date < today)

  const totalPurchased = packages.reduce((sum, pkg) => sum + pkg.hours_purchased, 0)
  const totalUsed = packages.reduce((sum, pkg) => sum + pkg.hours_used, 0)
  const hoursBalance = totalPurchased - totalUsed

  const totalFlightHours = flightLogs.reduce((sum, log) => {
    if (log.hobbs_end && log.hobbs_start) return sum + (log.hobbs_end - log.hobbs_start)
    return sum + (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
  }, 0)

  const lastFlightBooking = bookings.filter(b => b.date < today).sort((a, b) => b.date.localeCompare(a.date))[0]
  const totalBilled = billingRecords.reduce((sum, r) => sum + (r.total_amount || 0), 0)
  const totalBilledHours = billingRecords.reduce((sum, r) => sum + (r.hours_flown || 0), 0)
  const unpaidHours = Math.max(0, totalFlightHours - totalBilledHours)
  const remainingHours = totalPurchased - totalFlightHours
  const pastBookingIds = pastBookings.map(b => b.id)
  const reportedBookingIds = new Set(flightLogs.map(l => l.booking_id))
  const unclosedLogs = pastBookings.filter(b => !reportedBookingIds.has(b.id))

  const inputClass = "w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"

  async function savePilotEdit() {
    await fetch(`/api/pilots/${pilotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditing(false)
    loadPilot()
  }

  async function toggleActive() {
    if (!pilot) return
    await fetch(`/api/pilots/${pilotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !pilot.is_active }),
    })
    loadPilot()
  }

  async function addPackage(e: React.FormEvent) {
    e.preventDefault()
    const notesWithType = packageForm.purchase_type === 'individual'
      ? `[individual] ${packageForm.notes}`.trim()
      : packageForm.notes
    await fetch(`/api/pilots/${pilotId}/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...packageForm, notes: notesWithType }),
    })
    setPackageForm({ hours_purchased: '', price_paid: '', purchase_date: new Date().toISOString().split('T')[0], notes: '', purchase_type: 'package' })
    setShowPackageForm(false)
    loadData()
  }

  async function addBilling(e: React.FormEvent) {
    e.preventDefault()
    const hours = parseFloat(billingForm.hours_flown) || 0
    const rate = parseFloat(billingForm.rate_per_hour) || 0
    await fetch(`/api/pilots/${pilotId}/billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flight_date: billingForm.flight_date || null,
        hours_flown: hours,
        rate_per_hour: rate,
        total_amount: hours * rate,
        notes: billingForm.notes || null,
      }),
    })
    setBillingForm({ flight_date: '', hours_flown: '', rate_per_hour: '', notes: '' })
    setShowBillingForm(false)
    loadData()
  }

  function formatDate(d: string) {
    if (!d) return '-'
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  function getFlightLogForBooking(bookingId: string) {
    return flightLogs.find(l => l.booking_id === bookingId)
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-sm mx-auto px-4 py-20 pb-20 md:pb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-gray-900 font-bold text-xl text-center mb-6">כניסת מנהל</h2>
            <form onSubmit={login} className="space-y-4">
              <input type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה"
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg text-center"
                autoFocus />
              <button type="submit"
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-colors">
                כניסה
              </button>
              {loginError && <p className="text-red-600 text-center text-sm">{loginError}</p>}
            </form>
          </div>
        </main>
      </div>
    )
  }

  if (loading && !pilot) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-gray-500 py-16">טוען...</div>
        </main>
      </div>
    )
  }

  if (error && !pilot) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-red-600 py-16">{error}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        {/* Back button */}
        <a href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm">
          ← חזרה לניהול
        </a>

        {/* Section A - Pilot Header */}
        {pilot && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              {editing ? (
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">שם</label>
                      <input type="text" value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">טלפון</label>
                      <input type="tel" value={editForm.phone}
                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">מספר רישיון</label>
                      <input type="text" value={editForm.license_number}
                        onChange={e => setEditForm({ ...editForm, license_number: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">אימייל</label>
                      <input type="email" value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        className={inputClass} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={savePilotEdit} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium">שמור</button>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium">ביטול</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-gray-900 font-bold text-2xl">{pilot.name}</h1>
                    <button onClick={() => {
                      setEditing(true)
                      setEditForm({
                        name: pilot.name,
                        phone: pilot.phone || '',
                        license_number: pilot.license_number || '',
                        email: pilot.email || '',
                      })
                    }} className="text-gray-500 hover:text-gray-900 text-sm">✏️ ערוך</button>
                  </div>
                  {pilot.phone && <div className="text-gray-500 text-sm">{pilot.phone}</div>}
                  {pilot.license_number && <div className="text-gray-500 text-sm">רישיון: {pilot.license_number}</div>}
                  {pilot.email && <div className="text-gray-500 text-sm">{pilot.email}</div>}
                </div>
              )}

              <button onClick={toggleActive}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pilot.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}>
                {pilot.is_active ? 'פעיל' : 'לא פעיל'}
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-black text-gray-900">{bookings.length}</div>
                <div className="text-xs uppercase tracking-wide text-gray-500">✈️ סה&quot;כ טיסות</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-black text-gray-900">{Math.round(totalFlightHours * 10) / 10}</div>
                <div className="text-xs uppercase tracking-wide text-gray-500">⏱️ שעות כולל</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-black text-gray-900">
                  {lastFlightBooking ? formatDate(lastFlightBooking.date) : '-'}
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-500">📅 טיסה אחרונה</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className={`text-2xl font-black ${unpaidHours > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {Math.round(unpaidHours * 10) / 10}
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-500">⚠️ שעות לא שולמו</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className={`text-2xl font-black ${remainingHours > 0 ? 'text-green-600' : remainingHours === 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {Math.round(remainingHours * 10) / 10}
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-500">🎟️ שעות שנותרו</div>
              </div>
            </div>
          </div>
        )}

        {/* Unclosed flights warning */}
        {unclosedLogs.length > 0 && (
          <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="text-orange-700 font-bold text-sm mb-1">
                {unclosedLogs.length} טיסה{unclosedLogs.length > 1 ? 'ות' : ''} ללא דיווח — שעות חסרות!
              </div>
              <div className="text-orange-600 text-xs">
                הזמנות עבר שעדיין לא קיבלו דיווח טיסה — חישוב השעות עלול להיות חלקי.
              </div>
            </div>
          </div>
        )}

        {/* Section B - Billing & Hours */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          {true && (
            <div className="space-y-4">
              {/* Balance display */}
              <div className={`text-center p-4 rounded-xl border ${remainingHours > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className={`text-5xl font-black ${remainingHours > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {Math.round(remainingHours * 10) / 10}
                </div>
                <div className="text-gray-700 text-base">שעות נותרו מתוך {Math.round(totalPurchased * 10) / 10} שנרכשו</div>
                <div className="text-gray-500 text-base mt-1">{Math.round(totalFlightHours * 10) / 10} שעות נטסו בפועל</div>
              </div>

              {/* Two add buttons */}
              <div className="flex gap-2">
                <button onClick={() => { setShowPackageForm(showPackageForm && packageForm.purchase_type === 'package' ? false : true); setPackageForm(f => ({ ...f, purchase_type: 'package' })) }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showPackageForm && packageForm.purchase_type === 'package' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}>
                  {showPackageForm && packageForm.purchase_type === 'package' ? '✕ סגור' : '+ בנק שעות'}
                </button>
                <button onClick={() => { setShowPackageForm(showPackageForm && packageForm.purchase_type === 'individual' ? false : true); setPackageForm(f => ({ ...f, purchase_type: 'individual' })) }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showPackageForm && packageForm.purchase_type === 'individual' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}>
                  {showPackageForm && packageForm.purchase_type === 'individual' ? '✕ סגור' : '+ שעות בודדות'}
                </button>
              </div>

              {showPackageForm && (
                <form onSubmit={addPackage} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="text-gray-700 text-sm font-medium mb-2">
                    {packageForm.purchase_type === 'package' ? '📦 הוספת בנק שעות' : '🕐 הוספת שעות בודדות'}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">
                        {packageForm.purchase_type === 'package' ? 'שעות בחבילה' : 'מספר שעות'}
                      </label>
                      <input type="number" required step="0.1" value={packageForm.hours_purchased}
                        onChange={e => setPackageForm({ ...packageForm, hours_purchased: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">מחיר ששולם (₪)</label>
                      <input type="number" step="0.01" value={packageForm.price_paid}
                        onChange={e => setPackageForm({ ...packageForm, price_paid: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">תאריך רכישה</label>
                      <input type="date" value={packageForm.purchase_date}
                        onChange={e => setPackageForm({ ...packageForm, purchase_date: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">הערות</label>
                      <input type="text" value={packageForm.notes}
                        onChange={e => setPackageForm({ ...packageForm, notes: e.target.value })}
                        className={inputClass} />
                    </div>
                  </div>
                  <button type="submit" className="px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-base font-bold">
                    הוסף
                  </button>
                </form>
              )}

              {/* Unified packages table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">סוג</th>
                      <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">תאריך</th>
                      <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">שעות שנרכשו</th>
                      <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-3">מחיר</th>
                      <th className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">הערות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map(pkg => {
                      const isIndividual = pkg.notes?.startsWith('[individual]')
                      const displayNotes = isIndividual ? pkg.notes?.replace('[individual]', '').trim() : pkg.notes
                      return (
                        <tr key={pkg.id} className="border-b border-gray-100 even:bg-gray-50/50 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${isIndividual ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                              {isIndividual ? '🕐 בודדות' : '📦 בנק'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-base text-gray-500">{formatDate(pkg.purchase_date)}</td>
                          <td className="py-3 px-4 text-base text-gray-900 font-bold">{pkg.hours_purchased}</td>
                          <td className="py-3 px-3 text-sm text-gray-500">{pkg.price_paid ? `₪${pkg.price_paid.toLocaleString()}` : '-'}</td>
                          <td className="hidden sm:table-cell py-3 px-4 text-base text-gray-500">{displayNotes || '-'}</td>
                        </tr>
                      )
                    })}
                    {packages.length === 0 && (
                      <tr><td colSpan={5} className="p-4 text-center text-gray-500">אין רכישות שעות</td></tr>
                    )}
                    {packages.length > 0 && (
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan={2} className="p-3 text-gray-700 font-bold">סה&quot;כ</td>
                        <td className="p-3 text-gray-900 font-bold">{Math.round(totalPurchased * 10) / 10} שעות</td>
                        <td colSpan={2}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Section C - Flights History */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex gap-2 mb-4">
            {(['טיסות עתידיות', 'טיסות שעברו'] as FlightTab[]).map(tab => (
              <button key={tab} onClick={() => setFlightTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  flightTab === tab ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {flightTab === 'טיסות עתידיות' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">תאריך</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">שעות</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">סטטוס</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">עם מדריך</th>
                  </tr>
                </thead>
                <tbody>
                  {futureBookings.map(b => (
                    <tr key={b.id} className="border-b border-gray-100 even:bg-gray-50/50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-base text-gray-900">{formatDate(b.date)}</td>
                      <td className="py-3 px-4 text-base text-gray-500">{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          b.status === 'approved' ? 'bg-green-100 text-green-700' :
                          b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {b.status === 'approved' ? 'מאושר' : b.status === 'pending' ? 'ממתין' : 'נדחה'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-base text-gray-500">{b.with_instructor ? (b.instructor_name || 'כן') : 'לא'}</td>
                    </tr>
                  ))}
                  {futureBookings.length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center text-gray-500">אין טיסות עתידיות</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {flightTab === 'טיסות שעברו' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">תאריך</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">שעות</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">Hobbs</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">דלק</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 text-right py-3 px-4">שמן</th>
                  </tr>
                </thead>
                <tbody>
                  {pastBookings.map(b => {
                    const log = getFlightLogForBooking(b.id)
                    return (
                      <tr key={b.id} className="border-b border-gray-100 even:bg-gray-50/50 hover:bg-gray-50">
                        <td className="py-3 px-4 text-base text-gray-900">{formatDate(b.date)}</td>
                        <td className="py-3 px-4 text-base text-gray-500">{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</td>
                        {log ? (
                          <>
                            <td className="py-3 px-4 text-base text-gray-900">{log.hobbs_start} → {log.hobbs_end}</td>
                            <td className="py-3 px-4 text-base text-gray-500">{log.fuel_added_liters}L</td>
                            <td className="py-3 px-4 text-base text-gray-500">{log.oil_engine1}/{log.oil_engine2}qt</td>
                          </>
                        ) : (
                          <td colSpan={3} className="p-3 text-center">
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">אין דיווח</span>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {pastBookings.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">אין טיסות שעברו</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Total hours from flight logs */}
          {flightTab === 'טיסות שעברו' && flightLogs.length > 0 && (
            <div className="border-t border-gray-200 pt-3 mt-3">
              <span className="text-gray-500 text-sm">סה&quot;כ שעות טיסה (מ-flight logs): </span>
              <span className="text-gray-900 font-bold">{Math.round(totalFlightHours * 10) / 10}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
