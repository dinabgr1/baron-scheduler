'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import FuelCalculator from '@/components/FuelCalculator'

type MaintenanceRecord = {
  id: string; maintenance_type: string; last_done_date: string | null;
  last_done_hobbs: number; interval_hours: number; interval_months: number | null; notes: string | null
}

export default function ToolsPage() {
  const [pilotName, setPilotName] = useState('')
  const [lastFlight, setLastFlight] = useState<{ date: string; start_time: string; end_time: string; hobbs_start: number; hobbs_end: number; flight_hours: number } | null>(null)
  const [searchDone, setSearchDone] = useState(false)
  const [maintenance, setMaintenance] = useState<{ records: MaintenanceRecord[]; currentHobbs: number } | null>(null)

  useEffect(() => {
    fetch('/api/maintenance').then(r => r.json()).then(setMaintenance).catch(() => {})
  }, [])

  async function searchPilot() {
    if (!pilotName.trim()) return
    setSearchDone(false)
    try {
      const bRes = await fetch('/api/bookings')
      const bookings = await bRes.json()
      const pilotBookings = bookings.filter((b: { pilot_name: string; date: string }) =>
        b.pilot_name.toLowerCase() === pilotName.trim().toLowerCase()
      ).sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date))

      if (pilotBookings.length === 0) {
        setLastFlight(null)
        setSearchDone(true)
        return
      }

      const lastBooking = pilotBookings[0]
      const lRes = await fetch('/api/flight-logs')
      const logs = await lRes.json()
      const log = logs.find((l: { booking_id: string }) => l.booking_id === lastBooking.id)

      setLastFlight({
        date: lastBooking.date,
        start_time: lastBooking.start_time,
        end_time: lastBooking.end_time,
        hobbs_start: log?.hobbs_start || 0,
        hobbs_end: log?.hobbs_end || 0,
        flight_hours: log ? (log.hobbs_end && log.hobbs_start ? Math.round((log.hobbs_end - log.hobbs_start) * 10) / 10 : (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60) : 0,
      })
      setSearchDone(true)
    } catch {
      setSearchDone(true)
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">כלים</h2>
          <p className="text-gray-500">Baron 4X-DZJ | כלי עזר לטייסים</p>
        </div>

        {/* ===== Maintenance Status ===== */}
        {maintenance && maintenance.records.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">🔧 מצב תחזוקה</h3>
            {maintenance.records.map(rec => {
              const hoursUsed = maintenance.currentHobbs - rec.last_done_hobbs
              const hoursRemaining = Math.round((rec.interval_hours - hoursUsed) * 10) / 10
              const pct = Math.min(100, (hoursUsed / rec.interval_hours) * 100)
              const isUrgent = hoursRemaining <= 10
              const isWarning = hoursRemaining <= 25
              return (
                <div key={rec.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-medium">{rec.notes || rec.maintenance_type}</span>
                    <span className={`text-sm font-bold ${isUrgent ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-green-600'}`}>
                      {hoursRemaining}h נותרו
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isUrgent ? 'bg-red-500' : isWarning ? 'bg-orange-400' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Hobbs נוכחי: {maintenance.currentHobbs}</span>
                    <span>ביקורת ב-{rec.last_done_hobbs + rec.interval_hours}h</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ===== Last Flight Lookup ===== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">🛩️ הטיסה האחרונה שלי</h3>
          <div className="flex gap-2">
            <input type="text" value={pilotName} onChange={e => setPilotName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchPilot()}
              placeholder="הכנס את שמך" className={inputClass} />
            <button onClick={searchPilot}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm whitespace-nowrap">
              חפש
            </button>
          </div>
          {searchDone && !lastFlight && (
            <p className="text-gray-500 text-sm text-center py-2">לא נמצאו טיסות</p>
          )}
          {lastFlight && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">תאריך</p>
                  <p className="font-bold text-gray-900">{lastFlight.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">שעות</p>
                  <p className="font-bold text-gray-900">{lastFlight.start_time} - {lastFlight.end_time}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hobbs</p>
                  <p className="font-bold text-gray-900">{lastFlight.hobbs_start} → {lastFlight.hobbs_end}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">זמן באוויר</p>
                  <p className="font-bold text-green-600">{lastFlight.flight_hours}h</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <FuelCalculator />
      </main>
    </div>
  )
}
