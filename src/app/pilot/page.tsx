'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'
import PageView from '@/components/PageView'

type Pilot = { id: string; name: string; phone: string | null; license_number: string | null }
type Booking = { id: string; pilot_name: string; date: string; start_time: string; end_time: string; status: string; with_instructor: boolean; instructor_name: string | null }
type FlightLog = { id: string; booking_id: string; hobbs_start: number; hobbs_end: number; flight_time_hours: number; flight_time_minutes: number; fuel_added_liters: number; created_at: string }
type HourPackage = { id: string; pilot_name: string; hours_purchased: number; hours_used: number; price_paid: number | null; purchase_date: string }

export default function PilotPortal() {
  const [pilotName, setPilotName] = useState('')
  const [pilot, setPilot] = useState<Pilot | null>(null)
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [flightLogs, setFlightLogs] = useState<FlightLog[]>([])
  const [packages, setPackages] = useState<HourPackage[]>([])

  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pilotStatus, setPilotStatus] = useState<'idle' | 'checking' | 'found' | 'not_found'>('idle')
  const [licenseInput, setLicenseInput] = useState('')
  const [licenseError, setLicenseError] = useState(false)
  const [verified, setVerified] = useState(false)
  const [foundPilotId, setFoundPilotId] = useState<string | null>(null)
  const [foundPilotLicense, setFoundPilotLicense] = useState<string | null>(null)
  const [allPilots, setAllPilots] = useState<Pilot[]>([])
  const [suggestions, setSuggestions] = useState<Pilot[]>([])

  const [editingBookingId, setEditingBookingId] = useState<string | null>(null)
  const [editBookingForm, setEditBookingForm] = useState({ date: '', start_time: '', end_time: '' })
  const [editSaving, setEditSaving] = useState(false)

  async function cancelBooking(id: string) {
    if (!confirm('בטוח שברצונך לבטל הזמנה זו?')) return
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== id))
      }
    } catch { /* ignore */ }
  }

  async function saveBookingEdit(id: string) {
    setEditSaving(true)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editBookingForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b))
        setEditingBookingId(null)
      }
    } catch { /* ignore */ }
    setEditSaving(false)
  }

  useEffect(() => {
    const name = pilotName.trim()
    if (name.length < 2) { setPilotStatus('idle'); return }
    if (checkTimer.current) clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(async () => {
      setPilotStatus('checking')
      try {
        const res = await fetch('/api/pilots')
        const pilots: Pilot[] = await res.json()
        setAllPilots(pilots)
        const exactMatch = pilots.find(p => p.name.trim().toLowerCase() === name.toLowerCase())
        const partial = pilots.filter(p => p.name.toLowerCase().includes(name.toLowerCase()))
        const match = exactMatch || (partial.length === 1 ? partial[0] : null)
        if (match) {
          setPilotStatus('found')
          setFoundPilotId(match.id)
          setFoundPilotLicense(match.license_number || null)
          setVerified(false)
          setLicenseInput('')
          setLicenseError(false)
          setSuggestions([])
        } else if (partial.length > 1) {
          setSuggestions(partial)
          setPilotStatus('not_found')
        } else {
          setSuggestions([])
          setPilotStatus('not_found')
        }
      } catch {
        setPilotStatus('idle')
      }
    }, 600)
  }, [pilotName])

  async function verifyLicense() {
    if (!foundPilotId || !licenseInput.trim()) return
    if (foundPilotLicense && licenseInput.trim().toLowerCase() === foundPilotLicense.toLowerCase()) {
      setLicenseError(false)
      setVerified(true)
      loadPilotData(foundPilotId)
      fetch('/api/log-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login_type: 'pilot', user_name: pilotName.trim() }) }).catch(() => {})
    } else {
      setLicenseError(true)
    }
  }

  async function loadPilotData(pilotId: string) {
    setSearching(true)
    setNotFound(false)
    try {
      const pilotsRes = await fetch(`/api/pilots/${pilotId}`)
      const found = await pilotsRes.json()
      if (!found || found.error) { setNotFound(true); return }
      setPilot(found)
      const [bookingsRes, logsRes, packagesRes] = await Promise.all([
        fetch(`/api/pilots/${pilotId}/bookings`),
        fetch(`/api/pilots/${pilotId}/flight-logs`),
        fetch(`/api/pilots/${pilotId}/packages`),
      ])
      const [bookingsData, logsData, packagesData] = await Promise.all([
        bookingsRes.json(), logsRes.json(), packagesRes.json(),
      ])
      if (Array.isArray(bookingsData)) setBookings(bookingsData.sort((a: Booking, b: Booking) => b.date.localeCompare(a.date)))
      if (Array.isArray(logsData)) setFlightLogs(logsData)
      if (Array.isArray(packagesData)) setPackages(packagesData)
    } catch { setNotFound(true) }
    finally { setSearching(false) }
  }

  async function search() { if (foundPilotId && verified) loadPilotData(foundPilotId) }

  const today = new Date().toISOString().split('T')[0]
  const futureBookings = bookings.filter(b => b.date >= today && (b.status === 'pending' || b.status === 'approved'))
  const pastBookings = bookings.filter(b => b.date < today)
  const reportedIds = new Set(flightLogs.map(l => l.booking_id))
  const unreportedFlights = pastBookings.filter(b => !reportedIds.has(b.id) && b.status === 'approved')

  const totalFlightHours = flightLogs.reduce((sum, log) => {
    if (log.hobbs_end && log.hobbs_start) return sum + (log.hobbs_end - log.hobbs_start)
    return sum + (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
  }, 0)

  const totalPurchased = packages.reduce((s, p) => s + p.hours_purchased, 0)
  const remaining = Math.round((totalPurchased - totalFlightHours) * 10) / 10

  const last5Flights = flightLogs.slice(0, 5).map(log => {
    const booking = bookings.find(b => b.id === log.booking_id)
    const duration = log.hobbs_end && log.hobbs_start ? Math.round((log.hobbs_end - log.hobbs_start) * 10) / 10 : (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
    return { ...log, booking, duration }
  })

  function formatDate(d: string) {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white border border-baron-border text-baron-text placeholder-baron-muted focus:outline-none focus:border-baron-gold focus:ring-2 focus:ring-baron-gold/20"

  return (
    <div className="min-h-screen bg-baron-bg">
      <PageView page="פורטל טייס" />
      <Header />
      <main className="max-w-lg mx-auto px-4 pt-[68px] md:pt-[76px] pb-24 md:pb-12 space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-[15px] leading-none">הטייס שלי</h2>
          <p className="text-baron-muted text-[12px]">Baron 4X-DZJ · פורטל טייס</p>
        </div>

        {!pilot ? (
          <div className="card rounded-xl md:rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-baron-muted text-[11px] font-medium uppercase tracking-[0.1em] block mb-1.5">שם הטייס</label>
              <div className="relative">
                <input
                  type="text"
                  value={pilotName}
                  onChange={e => { setPilotName(e.target.value); setVerified(false); setPilot(null) }}
                  placeholder="הכנס את שמך"
                  className={inputClass}
                />
                {pilotStatus === 'checking' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-baron-muted text-sm">⏳</span>}
                {pilotStatus === 'found' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">✓</span>}
              </div>
              {pilotStatus === 'found' && <p className="text-emerald-500 text-[11px] mt-1 font-medium">✓ טייס קיים במערכת</p>}
              {pilotStatus === 'not_found' && (
                <div>
                  <p className="text-orange-500 text-[11px] mt-1 font-medium">טייס לא נמצא במערכת</p>
                  {suggestions.length > 0 && (
                    <div className="mt-1 card rounded-lg overflow-hidden">
                      {suggestions.slice(0, 5).map(s => (
                        <button key={s.id} onClick={() => { setPilotName(s.name); setSuggestions([]) }}
                          className="block w-full text-right px-3 py-2 text-[13px] text-baron-text hover:bg-baron-gold/10 border-b border-baron-border last:border-0">
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {pilotStatus === 'found' && !verified && (
              <div className="bg-baron-gold/5 border border-baron-gold/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔐</span>
                  <div>
                    <p className="text-baron-text font-semibold text-[13px]">אימות זהות</p>
                    <p className="text-baron-muted text-[11px]">הכנס את מספר הרישיון שלך</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input type="text" value={licenseInput}
                    onChange={e => { setLicenseInput(e.target.value); setLicenseError(false) }}
                    onKeyDown={e => e.key === 'Enter' && verifyLicense()}
                    placeholder="מספר רישיון טיס"
                    className={"flex-1 px-3 py-2.5 rounded-lg border text-[13px] " + (licenseError ? 'border-baron-red bg-baron-red/5' : 'border-baron-gold/30 bg-white') + " text-baron-text focus:outline-none focus:border-baron-gold"} />
                  <button onClick={verifyLicense}
                    className="px-4 py-2 rounded-lg gold-bg text-baron-text font-semibold text-[13px]">
                    אמת
                  </button>
                </div>
                {licenseError && <p className="text-baron-red text-[11px] font-medium">מספר רישיון שגוי</p>}
                {!foundPilotLicense && <p className="text-orange-500 text-[11px]">⚠️ לא הוגדר רישיון לטייס זה. פנה למנהל.</p>}
              </div>
            )}

            {verified && (
              <p className="text-emerald-500 text-[11px] font-medium">✓ זהות אומתה</p>
            )}

            {notFound && (
              <div className="p-3 rounded-xl bg-baron-red/5 border border-baron-red/20 text-baron-red text-center text-[13px]">
                לא נמצא טייס בשם זה
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Pilot header */}
            <div className="card rounded-xl md:rounded-2xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-[18px] font-bold text-baron-text">{pilot.name}</h3>
                  {pilot.phone && <p className="text-baron-muted text-[12px]">{pilot.phone}</p>}
                  {pilot.license_number && <p className="text-baron-dim text-[11px]">רישיון: {pilot.license_number}</p>}
                </div>
                <button onClick={() => { setPilot(null); setPilotName('') }}
                  className="text-baron-muted hover:text-baron-text text-[12px]">התנתק</button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-baron-bg rounded-xl p-3 text-center">
                  <div className="font-mono text-[22px] font-medium text-baron-text leading-none">{Math.round(totalFlightHours * 10) / 10}</div>
                  <div className="text-baron-muted text-[10px] mt-1.5 uppercase tracking-[0.08em]">שעות טיסה</div>
                </div>
                <div className="bg-baron-bg rounded-xl p-3 text-center">
                  <div className="font-mono text-[22px] font-medium text-baron-text leading-none">{totalPurchased}</div>
                  <div className="text-baron-muted text-[10px] mt-1.5 uppercase tracking-[0.08em]">שעות שנרכשו</div>
                </div>
                <div className={`rounded-xl p-3 text-center ${remaining >= 0 ? 'bg-emerald-500/5' : 'bg-baron-red/5'}`}>
                  <div className={`font-mono text-[22px] font-medium leading-none ${remaining >= 0 ? 'text-emerald-500' : 'text-baron-red'}`}>{remaining}</div>
                  <div className="text-baron-muted text-[10px] mt-1.5 uppercase tracking-[0.08em]">נותרו</div>
                </div>
              </div>
            </div>

            {/* Unreported flights banner */}
            {unreportedFlights.length > 0 && (
              <a href="/post-flight" className="block">
                <div className="bg-baron-red/5 border border-baron-red/20 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <div className="text-baron-red font-bold text-[13px]">
                      יש לך {unreportedFlights.length} טיסות שלא דווחו!
                    </div>
                    <div className="text-baron-red/70 text-[11px]">לחץ כאן לדווח</div>
                  </div>
                </div>
              </a>
            )}

            {/* Upcoming bookings */}
            <div className="card rounded-xl md:rounded-2xl p-5 space-y-3">
              <h3 className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em] leading-none">הזמנות קרובות</h3>
              {futureBookings.length === 0 ? (
                <p className="text-baron-muted text-[13px] text-center py-3">אין הזמנות עתידיות</p>
              ) : (
                <div className="space-y-2">
                  {futureBookings.map(b => {
                    const isEditing = editingBookingId === b.id
                    return (
                      <div key={b.id} className={`rounded-xl p-3 border ${
                        b.status === 'approved' ? 'bg-emerald-500/[0.04] border-emerald-500/15' : 'bg-baron-gold/[0.04] border-baron-gold/15'
                      }`}>
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <input type="date" value={editBookingForm.date}
                                onChange={e => setEditBookingForm({ ...editBookingForm, date: e.target.value })}
                                className="px-2 py-1.5 rounded-lg border border-baron-border text-[13px] bg-white" />
                              <input type="time" value={editBookingForm.start_time}
                                onChange={e => setEditBookingForm({ ...editBookingForm, start_time: e.target.value })}
                                className="px-2 py-1.5 rounded-lg border border-baron-border text-[13px] bg-white" />
                              <input type="time" value={editBookingForm.end_time}
                                onChange={e => setEditBookingForm({ ...editBookingForm, end_time: e.target.value })}
                                className="px-2 py-1.5 rounded-lg border border-baron-border text-[13px] bg-white" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => saveBookingEdit(b.id)} disabled={editSaving}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-medium">
                                {editSaving ? '...' : '✓ שמור'}
                              </button>
                              <button onClick={() => setEditingBookingId(null)}
                                className="px-3 py-1.5 rounded-lg bg-baron-text/[0.06] text-baron-text text-[11px] font-medium">ביטול</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-baron-text font-medium text-[13px]">{formatDate(b.date)}</div>
                                <div className="font-mono text-baron-muted text-[12px]">{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</div>
                              </div>
                              <span className={`text-[10px] font-semibold px-2.5 py-[5px] rounded-md leading-none ${
                                b.status === 'approved'
                                  ? 'text-emerald-400/90 bg-emerald-400/[0.08]'
                                  : 'text-baron-red/90 bg-baron-red/[0.08]'
                              }`}>
                                {b.status === 'approved' ? 'מאושר' : 'ממתין'}
                              </span>
                            </div>
                            <div className="flex gap-3 mt-2 pt-2 border-t border-baron-border">
                              <button onClick={() => {
                                setEditingBookingId(b.id)
                                setEditBookingForm({ date: b.date, start_time: b.start_time, end_time: b.end_time })
                              }} className="text-baron-gold-text hover:text-baron-gold text-[11px] font-medium">
                                ✏️ ערוך
                              </button>
                              <button onClick={() => cancelBooking(b.id)}
                                className="text-baron-red/70 hover:text-baron-red text-[11px] font-medium">
                                ✕ בטל הזמנה
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Last 5 flights */}
            <div className="card rounded-xl md:rounded-2xl p-5 space-y-3">
              <h3 className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em] leading-none">טיסות אחרונות</h3>
              {last5Flights.length === 0 ? (
                <p className="text-baron-muted text-[13px] text-center py-3">אין טיסות מדווחות</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-baron-border">
                        <th className="text-baron-muted text-[10px] font-medium uppercase tracking-[0.08em] text-right py-2 px-2">תאריך</th>
                        <th className="text-baron-muted text-[10px] font-medium uppercase tracking-[0.08em] text-right py-2 px-2">Hobbs</th>
                        <th className="text-baron-muted text-[10px] font-medium uppercase tracking-[0.08em] text-right py-2 px-2">משך</th>
                      </tr>
                    </thead>
                    <tbody>
                      {last5Flights.map(f => (
                        <tr key={f.id} className="border-b border-baron-border last:border-0">
                          <td className="py-2 px-2 text-baron-text">{f.booking ? formatDate(f.booking.date) : '-'}</td>
                          <td className="py-2 px-2 font-mono text-baron-text/70">{f.hobbs_start} → {f.hobbs_end}</td>
                          <td className="py-2 px-2 font-mono text-baron-gold-text font-medium">{f.duration}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <a href="/availability" className="gold-bg hover:brightness-110 text-baron-text rounded-xl p-4 text-center font-bold text-[13px] transition-all">
                + הזמן טיסה
              </a>
              <a href="/post-flight" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl p-4 text-center font-bold text-[13px] transition-colors">
                📝 דווח טיסה
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
