'use client'

import Header from '@/components/Header'
import BookingForm from '@/components/BookingForm'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        {/* Hero Banner */}
        <div className="bg-[#1e3a5f] text-white rounded-2xl p-4 flex items-center gap-4">
          <span className="text-4xl">✈️</span>
          <div>
            <div className="font-bold text-lg">Beechcraft Baron 58</div>
            <div className="text-amber-400 font-mono font-bold">4X-DZJ</div>
            <div className="text-slate-300 text-sm">מוכן לטיסה הבאה שלך</div>
          </div>
        </div>

        {/* Booking Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-slate-800 font-bold text-lg mb-4">הזמנת טיסה</h3>
          <BookingForm />
        </div>
      </main>
    </div>
  )
}
