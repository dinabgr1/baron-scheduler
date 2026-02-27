'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import BookingForm from '@/components/BookingForm'
import WeeklyCalendar from '@/components/WeeklyCalendar'

export default function HomePage() {
  const [calendarKey, setCalendarKey] = useState(0)

  const refreshCalendar = useCallback(() => {
    setCalendarKey((k) => k + 1)
  }, [])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">הזמנת טיסה</h2>
          <p className="text-baron-blue-300">
            Beechcraft Baron 58 | <span className="font-mono font-bold text-baron-blue-200">4X-DZJ</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-baron-blue-900/50 rounded-xl border border-baron-blue-700/50 p-6">
              <h3 className="text-white font-bold text-lg mb-4">טופס הזמנה</h3>
              <BookingForm onSuccess={refreshCalendar} />
            </div>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-3">
            <WeeklyCalendar key={calendarKey} />
          </div>
        </div>
      </main>
    </div>
  )
}
