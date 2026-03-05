'use client'
export const runtime = 'edge'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { Pilot, Booking, FlightLog, HourPackage, BillingRecord, Rate } from '@/lib/db'

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

  // Document management state
  type PilotDocument = { id: string; pilot_name: string; document_type: string; expiry_date: string | null; notes: string | null; created_at: string }
  const [documents, setDocuments] = useState<PilotDocument[]>([])
  const [showDocForm, setShowDocForm] = useState(false)
  const [docForm, setDocForm] = useState({ document_type: 'רישיון טיס', expiry_date: '', notes: '' })
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editDocForm, setEditDocForm] = useState({ document_type: '', expiry_date: '', notes: '' })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [billingTab, setBillingTab] = useState<BillingTab>('שעות')
  const [flightTab, setFlightTab] = useState<FlightTab>('טיסות עתידיות')

  // Edit pilot state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', license_number: '', email: '' })
  const [twinStatus, setTwinStatus] = useState<string>('none')
  const [savingTwinStatus, setSavingTwinStatus] = useState(false)

  // Add package form
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [packageForm, setPackageForm] = useState({ hours_purchased: '', price_paid: '', purchase_date: new Date().toISOString().split('T')[0], notes: '', purchase_type: 'package' as 'package' | 'individual', hours_gift: '' })

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
    setTwinStatus(found.twin_engine_status || 'none')
    return found
  }, [pilotId])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [bookingsRes, logsRes, packagesRes, billingRes, ratesRes, docsRes] = await Promise.all([
        fetch(`/api/pilots/${pilotId}/bookings`),
        fetch(`/api/pilots/${pilotId}/flight-logs`),
        fetch(`/api/pilots/${pilotId}/packages`),
        fetch(`/api/pilots/${pilotId}/billing`),
        fetch('/api/rates'),
        fetch(`/api/pilots/${pilotId}/documents`),
      ])

      const [bookingsData, logsData, packagesData, billingData, ratesData, docsData] = await Promise.all([
        bookingsRes.json(),
        logsRes.json(),
        packagesRes.json(),
        billingRes.json(),
        ratesRes.json(),
        docsRes.json(),
      ])

      if (Array.isArray(bookingsData)) setBookings(bookingsData)
      if (Array.isArray(logsData)) setFlightLogs(logsData)
      if (Array.isArray(packagesData)) setPackages(packagesData)
      if (Array.isArray(billingData)) setBillingRecords(billingData)
      if (Array.isArray(ratesData)) setRates(ratesData)
      if (Array.isArray(docsData)) setDocuments(docsData)
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
  // Unpaid = hours flown beyond purchased package (package is pre-paid)
  const unpaidHours = totalPurchased > 0 ? Math.max(0, totalFlightHours - totalPurchased) : Math.max(0, totalFlightHours - totalBilledHours)
  const remainingHours = totalPurchased - totalFlightHours
  const pastBookingIds = pastBookings.map(b => b.id)
  const reportedBookingIds = new Set(flightLogs.map(l => l.booking_id))
  const unclosedLogs = pastBookings.filter(b => !reportedBookingIds.has(b.id))

  const inputClass = "w-full px-3 py-2 rounded-lg bg-white border border-baron-border text-baron-text placeholder-baron-muted text-sm focus:outline-none focus:border-baron-gold focus:ring-2 focus:ring-baron-gold/20"

  async function savePilotEdit() {
    await fetch(`/api/pilots/${pilotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditing(false)
    loadPilot()
  }

  async function saveTwinEngineStatus(newStatus: string) {
    setSavingTwinStatus(true)
    await fetch(`/api/pilots/${pilotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ twin_engine_status: newStatus }),
    })
    setTwinStatus(newStatus)
    setSavingTwinStatus(false)
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
    const giftHours = parseFloat(packageForm.hours_gift || '0')
    const totalHours = parseFloat(packageForm.hours_purchased || '0') + giftHours
    const giftNote = giftHours > 0 ? ` (כולל ${giftHours} שעות מתנה)` : ''
    await fetch(`/api/pilots/${pilotId}/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...packageForm, hours_purchased: String(totalHours), notes: (notesWithType + giftNote).trim() }),
    })
    setPackageForm({ hours_purchased: '', price_paid: '', purchase_date: new Date().toISOString().split('T')[0], notes: '', purchase_type: 'package', hours_gift: '' })
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

  async function addDocument(e: React.FormEvent) {
    e.preventDefault()
    await fetch(`/api/pilots/${pilotId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docForm),
    })
    setDocForm({ document_type: 'רישיון טיס', expiry_date: '', notes: '' })
    setShowDocForm(false)
    loadData()
  }

  async function updateDocument(id: string) {
    await fetch(`/api/pilots/${pilotId}/documents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editDocForm }),
    })
    setEditingDocId(null)
    loadData()
  }

  async function deleteDocument(id: string) {
    if (!confirm('למחוק מסמך?')) return
    await fetch(`/api/pilots/${pilotId}/documents?doc_id=${id}`, { method: 'DELETE' })
    loadData()
  }

  function getDocColorClass(expiryDate: string | null) {
    if (!expiryDate) return { bg: 'bg-gray-100', text: 'text-gray-700' }
    const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { bg: 'bg-red-100', text: 'text-red-700' }
    if (days < 30) return { bg: 'bg-red-50', text: 'text-red-600' }
    if (days < 60) return { bg: 'bg-orange-50', text: 'text-orange-600' }
    return { bg: 'bg-green-50', text: 'text-green-600' }
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
      <div className="min-h-screen bg-baron-bg">
        <Header />
        <main className="max-w-sm mx-auto px-4 py-20 pb-20 md:pb-6">
          <div className="card rounded-xl p-6">
            <h2 className="text-gray-900 font-bold text-xl text-center mb-6">כניסת מנהל</h2>
            <form onSubmit={login} className="space-y-4">
              <input type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה"
                className="w-full px-4 py-3 rounded-lg bg-white border border-baron-border text-gray-900 placeholder-gray-400 focus:outline-none focus:border-baron-gold focus:ring-1 focus:ring-baron-gold/20 text-lg text-center"
                autoFocus />
              <button type="submit"
                className="w-full py-4 rounded-xl gold-bg hover:opacity-90 text-white font-bold text-lg transition-colors">
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
      <div className="min-h-screen bg-baron-bg">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-baron-muted py-16">טוען...</div>
        </main>
      </div>
    )
  }

  if (error && !pilot) {
    return (
      <div className="min-h-screen bg-baron-bg">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-red-600 py-16">{error}</div>
        </main>
      </div>
    )
  }

  const adminTabs = ['הזמנות', 'טייסים', 'פיננסים', 'תחזוקה', 'דוחות']

  return (
    <div className="min-h-screen bg-baron-bg" dir="rtl">
      <Header />
      {/* Admin page header */}
      <div className="page-header pt-[52px] md:pt-[63px] pb-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-semibold text-[15px] leading-none text-white">כרטיס טייס</h2>
            <p className="text-white/50 text-[11px]">{pilot?.name || '...'}</p>
          </div>
          <Link href="/admin" className="text-baron-gold-light hover:text-white text-[12px] font-medium transition-colors">
            חזרה לניהול ←
          </Link>
        </div>
      </div>
      {/* Admin tabs navigation */}
      <div className="bg-white border-b border-baron-border sticky top-[52px] md:top-[63px] z-40">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-2">
          {adminTabs.map(tab => (
            <Link
              key={tab}
              href={`/admin?tab=${encodeURIComponent(tab)}`}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
                tab === 'טייסים'
                  ? 'bg-baron-gold text-white'
                  : 'text-baron-muted hover:bg-baron-bg'
              }`}
            >
              {tab}
            </Link>
          ))}
        </div>
      </div>
      <main className="max-w-4xl mx-auto px-4 py-4 pb-20 md:pb-6 space-y-4">

        {/* Section A - Pilot Header */}
        {pilot && (
          <div className="card rounded-xl p-5">
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
                    <button onClick={savePilotEdit} className="px-4 py-2 rounded-lg gold-bg text-white text-sm font-medium">שמור</button>
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
                  pilot.is_active ? 'bg-baron-gold/10 text-baron-gold-text hover:bg-baron-gold/20' : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}>
                {pilot.is_active ? 'פעיל' : 'לא פעיל'}
              </button>
            </div>

            {/* Twin engine status */}
            <div className="mb-4 p-3 rounded-lg bg-baron-bg border border-baron-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">סטטוס הגדר דו מנועי</div>
                  <div className="flex gap-2">
                    {[
                      { value: 'none', label: 'אין' },
                      { value: 'cadet', label: 'חניך לרישיון קבוצה ב\'' },
                      { value: 'licensed', label: 'בעל רישיון קבוצה ב\'' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => saveTwinEngineStatus(opt.value)}
                        disabled={savingTwinStatus}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          twinStatus === opt.value
                            ? 'bg-baron-gold text-white'
                            : 'bg-white border border-baron-border text-baron-muted hover:bg-baron-bg'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {twinStatus === 'cadet' && pilot && (
                  <a
                    href={`/cadet/${encodeURIComponent(pilot.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium gold-bg text-white"
                  >
                    📋 תיק חניך
                  </a>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-baron-bg rounded-lg p-3 text-center">
                <div className="text-2xl font-black text-gray-900">{bookings.length}</div>
                <div className="text-xs uppercase tracking-wide text-gray-500">✈️ סה&quot;כ טיסות</div>
              </div>
              <div className="bg-baron-bg rounded-lg p-3 text-center">
                <div className="text-2xl font-black text-gray-900">{Math.round(totalFlightHours * 10) / 10}</div>
                <div className="text-xs uppercase tracking-wide text-gray-500">⏱️ שעות כולל</div>
              </div>

              <div className="bg-baron-bg rounded-lg p-3 text-center">
                <div className="text-2xl font-black text-gray-900">
                  {lastFlightBooking ? formatDate(lastFlightBooking.date) : '-'}
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-500">📅 טיסה אחרונה</div>
              </div>
              <div className="bg-baron-bg rounded-lg p-3 text-center">
                <div className={`text-2xl font-black ${unpaidHours > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {Math.round(unpaidHours * 10) / 10}
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-500">⚠️ שעות לא שולמו</div>
              </div>
              <div className="bg-baron-bg rounded-lg p-3 text-center">
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
        <div className="card rounded-xl p-5">
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

              <button onClick={() => setShowPackageForm(!showPackageForm)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showPackageForm ? 'bg-red-600 hover:bg-red-700 text-white' : 'gold-bg text-white'
                }`}>
                {showPackageForm ? '✕ סגור' : '+ הוספת רכישת שעות'}
              </button>

              {showPackageForm && (
                <form onSubmit={addPackage} className="card rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-700 font-semibold text-sm">💼 הוספת רכישת שעות</h3>
                    {rates.length > 0 && <span className="text-xs text-gray-500">תעריף: ₪{rates[0]?.rate_per_hour?.toLocaleString()}/שעה</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">הערות</label>
                      <input type="text" value={packageForm.notes}
                        onChange={e => setPackageForm({ ...packageForm, notes: e.target.value })}
                        className={inputClass} />
                    </div>
                  </div>
                  {packageForm.hours_purchased && (
                    <div className="bg-baron-gold/5 border border-baron-border rounded-lg px-3 py-2 text-sm text-baron-text space-y-0.5">
                      {packageForm.price_paid && <div>💰 {packageForm.hours_purchased} שעות × ₪{rates[0]?.rate_per_hour?.toLocaleString() || '?'} = <strong>₪{packageForm.price_paid}</strong></div>}
                      {parseFloat(packageForm.hours_gift || '0') > 0 && (
                        <div className="text-green-700">🎁 + {packageForm.hours_gift} שעות מתנה | סה״כ: <strong>{(parseFloat(packageForm.hours_purchased||'0') + parseFloat(packageForm.hours_gift||'0'))} שעות</strong></div>
                      )}
                    </div>
                  )}
                  <button type="submit" className="w-full py-2.5 rounded-lg gold-bg text-white font-bold">
                    + הוסף רכישת שעות
                  </button>
                </form>
              )}

              {/* Unified packages table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-baron-border bg-baron-bg">
                      <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">סוג</th>
                      <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">תאריך</th>
                      <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">שעות שנרכשו</th>
                      <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-3">מחיר</th>
                      <th className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">הערות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map(pkg => {
                      const isIndividual = pkg.notes?.startsWith('[individual]')
                      const displayNotes = isIndividual ? pkg.notes?.replace('[individual]', '').trim() : pkg.notes
                      return (
                        <tr key={pkg.id} className="border-b border-baron-border even:bg-baron-bg/50 hover:bg-baron-bg">
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
        <div className="card rounded-xl p-5">
          <div className="flex gap-2 mb-4">
            {(['טיסות עתידיות', 'טיסות שעברו'] as FlightTab[]).map(tab => (
              <button key={tab} onClick={() => setFlightTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  flightTab === tab ? 'bg-baron-gold text-white' : 'bg-white border border-baron-border text-baron-muted hover:bg-baron-bg'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {flightTab === 'טיסות עתידיות' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-baron-border bg-baron-bg">
                    <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">תאריך</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">שעות</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">סטטוס</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">עם מדריך</th>
                  </tr>
                </thead>
                <tbody>
                  {futureBookings.map(b => (
                    <tr key={b.id} className="border-b border-baron-border even:bg-baron-bg/50 hover:bg-baron-bg">
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
                  <tr className="border-b border-baron-border bg-baron-bg">
                    <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">תאריך</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">שעות</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">Hobbs</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">דלק</th>
                    <th className="text-xs font-semibold uppercase tracking-wide text-baron-muted bg-baron-bg text-right py-3 px-4">שמן</th>
                  </tr>
                </thead>
                <tbody>
                  {pastBookings.map(b => {
                    const log = getFlightLogForBooking(b.id)
                    return (
                      <tr key={b.id} className="border-b border-baron-border even:bg-baron-bg/50 hover:bg-baron-bg">
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
            <div className="border-t border-baron-border pt-3 mt-3">
              <span className="text-baron-muted text-sm">סה&quot;כ שעות טיסה (מ-flight logs): </span>
              <span className="text-baron-text font-bold">{Math.round(totalFlightHours * 10) / 10}</span>
            </div>
          )}
        </div>
        {/* PDF Export Button */}
        <div className="flex justify-center">
          <a href={`/api/pilots/${pilotId}/pdf`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gold-bg text-white font-bold transition-colors">
            📄 ייצוא PDF
          </a>
        </div>

        {/* Section D - Documents */}
        <div className="card rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-900 font-bold text-lg">📄 מסמכים</h3>
            <button onClick={() => setShowDocForm(!showDocForm)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showDocForm ? 'bg-red-600 hover:bg-red-700 text-white' : 'gold-bg text-white'
              }`}>
              {showDocForm ? '✕ סגור' : '+ הוסף מסמך'}
            </button>
          </div>

          {showDocForm && (
            <form onSubmit={addDocument} className="mb-4 bg-baron-bg rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1">סוג מסמך</label>
                  <select value={docForm.document_type}
                    onChange={e => setDocForm({ ...docForm, document_type: e.target.value })}
                    className={inputClass}>
                    <option value="רישיון טיס">רישיון טיס</option>
                    <option value="בדיקה רפואית">בדיקה רפואית</option>
                    <option value="ביטוח">ביטוח</option>
                    <option value="אישור Class Rating">אישור Class Rating</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1">תאריך תפוגה</label>
                  <input type="date" value={docForm.expiry_date}
                    onChange={e => setDocForm({ ...docForm, expiry_date: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1">הערות</label>
                  <input type="text" value={docForm.notes}
                    onChange={e => setDocForm({ ...docForm, notes: e.target.value })}
                    className={inputClass} />
                </div>
              </div>
              <button type="submit" className="px-4 py-2 rounded-lg gold-bg text-white font-bold text-sm">
                הוסף מסמך
              </button>
            </form>
          )}

          {documents.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">אין מסמכים</p>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => {
                const colors = getDocColorClass(doc.expiry_date)
                const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date()
                const daysUntil = doc.expiry_date
                  ? Math.floor((new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null
                const isEditingDoc = editingDocId === doc.id

                return (
                  <div key={doc.id} className={`rounded-lg p-3 border border-gray-200 ${colors.bg}`}>
                    {isEditingDoc ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <select value={editDocForm.document_type}
                            onChange={e => setEditDocForm({ ...editDocForm, document_type: e.target.value })}
                            className={inputClass}>
                            <option value="רישיון טיס">רישיון טיס</option>
                            <option value="בדיקה רפואית">בדיקה רפואית</option>
                            <option value="ביטוח">ביטוח</option>
                            <option value="אישור Class Rating">אישור Class Rating</option>
                          </select>
                          <input type="date" value={editDocForm.expiry_date}
                            onChange={e => setEditDocForm({ ...editDocForm, expiry_date: e.target.value })}
                            className={inputClass} />
                          <input type="text" value={editDocForm.notes}
                            onChange={e => setEditDocForm({ ...editDocForm, notes: e.target.value })}
                            placeholder="הערות" className={inputClass} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateDocument(doc.id)}
                            className="px-3 py-1 rounded bg-green-600 text-white text-xs">שמור</button>
                          <button onClick={() => setEditingDocId(null)}
                            className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs">ביטול</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-gray-900 font-medium text-sm">{doc.document_type}</div>
                          <div className="text-gray-500 text-xs">
                            {doc.expiry_date ? `תפוגה: ${formatDate(doc.expiry_date)}` : 'ללא תאריך תפוגה'}
                            {daysUntil !== null && (
                              <span className={`mr-2 font-medium ${colors.text}`}>
                                {isExpired ? `(פג תוקף לפני ${Math.abs(daysUntil)} ימים)` : `(${daysUntil} ימים)`}
                              </span>
                            )}
                          </div>
                          {doc.notes && <div className="text-gray-400 text-xs mt-0.5">{doc.notes}</div>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => {
                            setEditingDocId(doc.id)
                            setEditDocForm({
                              document_type: doc.document_type,
                              expiry_date: doc.expiry_date || '',
                              notes: doc.notes || '',
                            })
                          }} className="px-2 py-1 rounded bg-baron-gold text-white text-xs">ערוך</button>
                          <button onClick={() => deleteDocument(doc.id)}
                            className="px-2 py-1 rounded bg-red-600 text-white text-xs">מחק</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
