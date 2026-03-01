'use client'

import { useState, useEffect } from 'react'

type Notification = {
  type: 'pending' | 'maintenance' | 'documents'
  message: string
  count: number
}

export default function NotificationBanner() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const notifs: Notification[] = []

      try {
        // Pending bookings
        const bookingsRes = await fetch('/api/bookings?status=pending')
        const bookings = await bookingsRes.json()
        if (Array.isArray(bookings) && bookings.length > 0) {
          notifs.push({ type: 'pending', message: `${bookings.length} הזמנות ממתינות לאישור`, count: bookings.length })
        }

        // Maintenance approaching
        const maintRes = await fetch('/api/maintenance')
        const maintData = await maintRes.json()
        if (maintData?.records && maintData.currentHobbs) {
          const urgent = maintData.records.filter((r: { last_done_hobbs: number; interval_hours: number; interval_months?: number | null; last_done_date?: string | null }) => {
            if (r.interval_hours > 0) {
              const remaining = r.interval_hours - (maintData.currentHobbs - r.last_done_hobbs)
              return remaining < 25
            }
            if (r.interval_months && r.last_done_date) {
              const lastDone = new Date(r.last_done_date)
              const nextDue = new Date(lastDone)
              nextDue.setMonth(nextDue.getMonth() + r.interval_months)
              const daysRemaining = Math.floor((nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return daysRemaining < 30
            }
            return false
          })
          if (urgent.length > 0) {
            notifs.push({ type: 'maintenance', message: `${urgent.length} פריטי תחזוקה מתקרבים`, count: urgent.length })
          }
        }

        // Expired pilot documents
        const pilotsRes = await fetch('/api/pilots')
        const pilots = await pilotsRes.json()
        if (Array.isArray(pilots)) {
          let expiredCount = 0
          for (const p of pilots.slice(0, 20)) {
            try {
              const docRes = await fetch(`/api/pilots/${p.id}/documents`)
              const docs = await docRes.json()
              if (Array.isArray(docs)) {
                const expired = docs.filter((d: { expiry_date?: string }) => {
                  if (!d.expiry_date) return false
                  return new Date(d.expiry_date) < new Date()
                })
                expiredCount += expired.length
              }
            } catch { /* skip */ }
          }
          if (expiredCount > 0) {
            notifs.push({ type: 'documents', message: `${expiredCount} מסמכי טייס פגי תוקף`, count: expiredCount })
          }
        }
      } catch { /* silent */ }

      setNotifications(notifs)
    }

    load()
  }, [])

  const visible = notifications.filter(n => !dismissed.has(n.type))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      {visible.map(n => (
        <div key={n.type} className={`rounded-xl px-4 py-3 flex items-center justify-between border ${
          n.type === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          n.type === 'maintenance' ? 'bg-orange-50 border-orange-200 text-orange-800' :
          'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>{n.type === 'pending' ? '⏳' : n.type === 'maintenance' ? '🔧' : '📄'}</span>
            {n.message}
          </div>
          <button
            onClick={() => setDismissed(prev => { const next = new Set(prev); next.add(n.type); return next })}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
