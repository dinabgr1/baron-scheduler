'use client'

import Header from '@/components/Header'
import BookingForm from '@/components/BookingForm'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        {/* Hero Banner */}
        <div className="bg-blue-700 text-white rounded-2xl p-4 flex items-center gap-4">
          <span className="text-4xl">✈️</span>
          <div>
            <div className="font-bold text-lg">Beechcraft Baron 58</div>
            <div className="text-amber-300 font-mono font-bold">4X-DZJ</div>
            <div className="text-blue-100 text-sm">מוכן לטיסה הבאה שלך</div>
          </div>
        </div>

        {/* Booking Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-gray-900 font-bold text-lg mb-4">הזמנת טיסה</h3>
          <BookingForm />
        </div>
      </main>
    </div>
  )
}
