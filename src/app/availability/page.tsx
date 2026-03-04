'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import WeeklyCalendar from '@/components/WeeklyCalendar'
import PageView from '@/components/PageView'
import BookingForm from '@/components/BookingForm'

export default function AvailabilityPage() {
  const [showBooking, setShowBooking] = useState(false)

  return (
    <div className="min-h-screen bg-baron-bg">
      <PageView page="זמינות" />
      <Header onBookClick={() => setShowBooking(!showBooking)} />

      {/* Hero */}
      <div className="hero-img flex items-end pt-20 md:pt-0 min-h-[220px] md:min-h-[340px]">
        <div className="max-w-[1060px] mx-auto px-4 md:px-8 pb-8 md:pb-12 w-full">
          <h1 className="text-[28px] md:text-[40px] font-bold leading-[1.1] tracking-tight">
            Baron <span className="gold">58</span>
          </h1>
          <p className="text-baron-text/35 text-[13px] md:text-[14px] mt-2 tracking-wide">
            Beechcraft · Twin Engine · IFR · 166 Gal
          </p>
        </div>
      </div>

      <div className="w-full h-[3px] bg-gradient-to-l from-baron-red via-baron-gold to-transparent" />

      <main className="max-w-[1060px] mx-auto px-4 md:px-8 pb-24 md:pb-20 space-y-4 md:space-y-5 mt-3">
        {showBooking && (
          <div className="card rounded-xl md:rounded-2xl p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-[15px] leading-none">הזמן טיסה</h2>
              <button
                onClick={() => setShowBooking(false)}
                className="text-baron-muted hover:text-baron-text text-sm"
              >
                ✕
              </button>
            </div>
            <BookingForm onSuccess={() => setShowBooking(false)} />
          </div>
        )}

        <div className="card rounded-xl md:rounded-2xl overflow-hidden">
          <WeeklyCalendar />
        </div>
      </main>
    </div>
  )
}
