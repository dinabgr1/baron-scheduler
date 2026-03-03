'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import WeeklyCalendar from '@/components/WeeklyCalendar'
import PageView from '@/components/PageView'
import BookingForm from '@/components/BookingForm'

export default function AvailabilityPage() {
  const [showBooking, setShowBooking] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <PageView page="זמינות" />
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">זמינות המטוס</h2>
            <p className="text-slate-500 text-sm">Beechcraft Baron 58 | <span className="font-mono font-bold text-blue-600">4X-DZJ</span></p>
          </div>
          <button onClick={() => setShowBooking(!showBooking)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5 ${showBooking ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}>
            {showBooking ? '✕ סגור' : '✈️ הזמן טיסה'}
          </button>
        </div>

        {showBooking && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <BookingForm onSuccess={() => setShowBooking(false)} />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <WeeklyCalendar />
        </div>
      </main>
    </div>
  )
}
