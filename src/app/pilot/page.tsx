'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'

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

  // Auto-detect pilot (same logic as BookingForm)
  useEffect(() => {
    const name = pilotName.trim()
    if (name.length < 2) { setPilotStatus('idle'); return }
    if (checkTimer.current) clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(async () => {
      setPilotStatus('checking')
      try {
        const res = await fetch('/api/pilots')
        const pilots: Pilot[] = await res.json()
        const found = pilots.find(p => p.name.trim().toLowerCase() === name.toLowerCase())
        if (found) {
          setPilotStatus('found')
        } else {
          setPilotStatus('not_found')
        }
      } catch {
        setPilotStatus('idle')
      }
    }, 600)
  }, [pilotName])

  async function search() {
    if (!pilotName.trim()) return
    setSearching(true)
    setNotFound(false)
    setPilot(null)

    try {
      const pilotsRes = await fetch('/api/pilots')
      const pilots: Pilot[] = await pilotsRes.json()
      const found = pilots.find(p => p.name.trim().toLowerCase() === pilotName.trim().toLowerCase())

      if (!found) {
        setNotFound(true)
        setSearching(false)
        return
      }

      setPilot(found)

      // Load all data
      const [bookingsRes, logsRes, packagesRes] = await Promise.all([
        fetch(`/api/pilots/${found.id}/bookings`),
        fetch(`/api/pilots/${found.id}/flight-logs`),
        fetch(`/api/pilots/${found.id}/packages`),
      ])

      const [bookingsData, logsData, packagesData] = await Promise.all([
        bookingsRes.json(),
        logsRes.json(),
        packagesRes.json(),
      ])

      if (Array.isArray(bookingsData)) setBookings(bookingsData.sort((a: Booking, b: Booking) => b.date.localeCompare(a.date)))
      if (Array.isArray(logsData)) setFlightLogs(logsData)
      if (Array.isArray(packagesData)) setPackages(packagesData)
    } catch {
      setNotFound(true)
    } finally {
      setSearching(false)
    }
  }

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

  // Last 5 flights with details
  const last5Flights = flightLogs.slice(0, 5).map(log => {
    const booking = bookings.find(b => b.id === log.booking_id)
    const duration = log.hobbs_end && log.hobbs_start ? Math.round((log.hobbs_end - log.hobbs_start) * 10) / 10 : (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
    return { ...log, booking, duration }
  })

  function formatDate(d: string) {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">👤 הטייס שלי</h2>
          <p className="text-gray-500">Baron 4X-DZJ | פורטל טייס</p>
        </div>

        {!pilot ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">שם הטייס</label>
              <div className="relative">
                <input
                  type="text"
                  value={pilotName}
                  onChange={e => setPilotName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  placeholder="הכנס את שמך"
                  className={inputClass}
                />
                {pilotStatus === 'checking' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⏳</span>}
                {pilotStatus === 'found' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">✓</span>}
              </div>
              {pilotStatus === 'found' && <p className="text-green-600 text-xs mt-1 font-medium">✓ טייס קיים במערכת</p>}
              {pilotStatus === 'not_found' && <p className="text-orange-600 text-xs mt-1 font-medium">טייס לא נמצא במערכת</p>}
            </div>
            <button
              onClick={search}
              disabled={searching || !pilotName.trim()}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-lg transition-colors"
            >
              {searching ? 'מחפש...' : 'כניסה 🔍'}
            </button>
            {notFound && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-center text-sm">
                לא נמצא טייס בשם זה
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Pilot header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{pilot.name}</h3>
                  {pilot.phone && <p className="text-gray-500 text-sm">{pilot.phone}</p>}
                  {pilot.license_number && <p className="text-gray-400 text-xs">רישיון: {pilot.license_number}</p>}
                </div>
                <button onClick={() => { setPilot(null); setPilotName('') }}
                  className="text-gray-400 hover:text-gray-600 text-sm">התנתק</button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-black text-gray-900">{Math.round(totalFlightHours * 10) / 10}</div>
                  <div className="text-xs text-gray-500">שעות טיסה</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-black text-gray-900">{totalPurchased}</div>
                  <div className="text-xs text-gray-500">שעות שנרכשו</div>
                </div>
                <div className={`rounded-lg p-3 text-center ${remaining >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-2xl font-black ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>{remaining}</div>
                  <div className="text-xs text-gray-500">נותרו</div>
                </div>
              </div>
            </div>

            {/* Unreported flights banner */}
            {unreportedFlights.length > 0 && (
              <a href="/post-flight" className="block">
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <div className="text-red-700 font-bold text-sm">
                      יש לך {unreportedFlights.length} טיסות שלא דווחו!
                    </div>
                    <div className="text-red-600 text-xs">לחץ כאן לדווח</div>
                  </div>
                </div>
              </a>
            )}

            {/* Upcoming bookings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
              <h3 className="font-bold text-gray-900">📅 הזמנות קרובות</h3>
              {futureBookings.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-3">אין הזמנות עתידיות</p>
              ) : (
                <div className="space-y-2">
                  {futureBookings.map(b => (
                    <div key={b.id} className={`rounded-lg p-3 border ${
                      b.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-gray-900 font-medium text-sm">{formatDate(b.date)}</div>
                          <div className="text-gray-500 text-xs">{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          b.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {b.status === 'approved' ? 'מאושר' : 'ממתין'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Last 5 flights */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
              <h3 className="font-bold text-gray-900">🛩️ טיסות אחרונות</h3>
              {last5Flights.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-3">אין טיסות מדווחות</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right py-2 px-3">תאריך</th>
                        <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right py-2 px-3">Hobbs</th>
                        <th className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right py-2 px-3">משך</th>
                      </tr>
                    </thead>
                    <tbody>
                      {last5Flights.map(f => (
                        <tr key={f.id} className="border-b border-gray-100 even:bg-gray-50">
                          <td className="py-2 px-3 text-gray-900">{f.booking ? formatDate(f.booking.date) : '-'}</td>
                          <td className="py-2 px-3 text-gray-700">{f.hobbs_start} → {f.hobbs_end}</td>
                          <td className="py-2 px-3 text-gray-700 font-medium">{f.duration}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <a href="/availability" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 text-center font-bold transition-colors">
                ✈️ הזמן טיסה
              </a>
              <a href="/post-flight" className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-4 text-center font-bold transition-colors">
                📝 דווח טיסה
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
