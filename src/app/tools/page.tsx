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
    <div className="min-h-screen bg-baron-bg">
      <PageView page="כלים" />
      <Header />
      <main className="max-w-lg mx-auto px-4 pt-[68px] md:pt-[76px] pb-24 md:pb-12 space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-[15px] leading-none">כלים</h2>
          <p className="text-baron-muted text-[12px]">Baron 4X-DZJ · כלי עזר לטייסים</p>
        </div>

        {/* Maintenance Status */}
        {maintenance && maintenance.records.length > 0 && (
          <div className="card rounded-xl md:rounded-2xl p-5 space-y-4">
            <h3 className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em] leading-none">מצב תחזוקה</h3>
            {maintenance.records.map(rec => {
              const hoursUsed = maintenance.currentHobbs - rec.last_done_hobbs
              const hoursRemaining = Math.round((rec.interval_hours - hoursUsed) * 10) / 10
              const pct = Math.min(100, (hoursUsed / rec.interval_hours) * 100)
              const isUrgent = hoursRemaining <= 10
              const isWarning = hoursRemaining <= 25
              return (
                <div key={rec.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-baron-text font-medium">{rec.notes || rec.maintenance_type}</span>
                    <span className={`font-mono text-[13px] font-medium ${isUrgent ? 'text-baron-red' : isWarning ? 'text-orange-500' : 'text-emerald-500'}`}>
                      {hoursRemaining}h
                    </span>
                  </div>
                  <div className="h-[3px] bg-baron-text/[0.04] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isUrgent ? 'bg-baron-red' : isWarning ? 'bg-orange-400' : 'gold-bg'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-baron-muted">
                    <span>Hobbs נוכחי: {maintenance.currentHobbs}</span>
                    <span>ביקורת ב-{rec.last_done_hobbs + rec.interval_hours}h</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Last Flight */}
        {lastFlight && (
          <div className="card rounded-xl md:rounded-2xl p-5 space-y-3">
            <h3 className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em] leading-none">טיסה אחרונה של המטוס</h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-baron-muted text-[10px] uppercase tracking-[0.08em]">טייס</p>
                <p className="font-medium text-[14px] text-baron-text">{lastFlight.pilot_name}</p>
              </div>
              <div>
                <p className="text-baron-muted text-[10px] uppercase tracking-[0.08em]">תאריך</p>
                <p className="font-medium text-[14px] text-baron-text">{lastFlight.date}</p>
              </div>
              <div>
                <p className="text-baron-muted text-[10px] uppercase tracking-[0.08em]">Hobbs</p>
                <p className="font-mono text-[14px] text-baron-text">{lastFlight.hobbs_start} → {lastFlight.hobbs_end}</p>
              </div>
              <div>
                <p className="text-baron-muted text-[10px] uppercase tracking-[0.08em]">זמן באוויר</p>
                <p className="font-mono text-[14px] text-emerald-500 font-medium">{lastFlight.flight_hours}h</p>
              </div>
              <div>
                <p className="text-baron-muted text-[10px] uppercase tracking-[0.08em]">מפלס דלק</p>
                <p className="font-medium text-[14px] text-baron-text">{lastFlight.fuel_level}</p>
              </div>
              <div>
                <p className="text-baron-muted text-[10px] uppercase tracking-[0.08em]">שמן (מנוע 1 / 2)</p>
                <p className="font-mono text-[14px] text-baron-text">{lastFlight.oil}</p>
              </div>
            </div>
          </div>
        )}

        <FuelCalculator />
      </main>
    </div>
  )
}
