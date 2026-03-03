'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import FuelCalculator from '@/components/FuelCalculator'
import PageView from '@/components/PageView'

type MaintenanceRecord = {
  id: string; maintenance_type: string; last_done_date: string | null;
  last_done_hobbs: number; interval_hours: number; interval_months: number | null; notes: string | null
}

type LastFlight = {
  pilot_name: string; date: string; hobbs_start: number; hobbs_end: number;
  flight_hours: number; fuel_level: string; oil: string
}

export default function ToolsPage() {
  const [lastFlight, setLastFlight] = useState<LastFlight | null>(null)
  const [maintenance, setMaintenance] = useState<{ records: MaintenanceRecord[]; currentHobbs: number } | null>(null)

  useEffect(() => {
    fetch('/api/maintenance?pilots_only=true').then(r => r.json()).then(setMaintenance).catch(() => {})

    // Load last flight of the aircraft (not pilot-specific)
    Promise.all([fetch('/api/flight-logs'), fetch('/api/bookings')]).then(async ([lRes, bRes]) => {
      const logs = await lRes.json()
      const bookings = await bRes.json()
      if (!Array.isArray(logs) || logs.length === 0) return
      const lastLog = logs[0]
      const booking = Array.isArray(bookings) ? bookings.find((b: { id: string }) => b.id === lastLog.booking_id) : null
      const fuelLabels: Record<string, string> = { '1': '¼', '2': '½', '3': '¾', '4': 'מלא' }
      setLastFlight({
        pilot_name: booking?.pilot_name || '-',
        date: booking?.date || '-',
        hobbs_start: lastLog.hobbs_start || 0,
        hobbs_end: lastLog.hobbs_end || 0,
        flight_hours: lastLog.hobbs_end && lastLog.hobbs_start
          ? Math.round((lastLog.hobbs_end - lastLog.hobbs_start) * 10) / 10
          : (lastLog.flight_time_hours || 0) + (lastLog.flight_time_minutes || 0) / 60,
        fuel_level: fuelLabels[String(lastLog.fuel_level_quarters)] || String(lastLog.fuel_level_quarters || '-'),
        oil: `${lastLog.oil_engine1 || '-'} / ${lastLog.oil_engine2 || '-'} qt`,
      })
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <PageView page="כלים" />
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

        {/* ===== Last Flight of Aircraft ===== */}
        {lastFlight && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">🛩️ טיסה אחרונה של המטוס</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">טייס</p>
                  <p className="font-bold text-gray-900">{lastFlight.pilot_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">תאריך</p>
                  <p className="font-bold text-gray-900">{lastFlight.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hobbs</p>
                  <p className="font-bold text-gray-900">{lastFlight.hobbs_start} → {lastFlight.hobbs_end}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">זמן באוויר</p>
                  <p className="font-bold text-green-600">{lastFlight.flight_hours}h</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">מפלס דלק</p>
                  <p className="font-bold text-gray-900">{lastFlight.fuel_level}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">שמן (מנוע 1 / 2)</p>
                  <p className="font-bold text-gray-900">{lastFlight.oil}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <FuelCalculator />
      </main>
    </div>
  )
}
