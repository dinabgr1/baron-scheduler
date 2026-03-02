'use client'
export const runtime = 'edge'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { Booking } from '@/lib/supabase'

export default function ApprovePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = require('react').use(paramsPromise) as { id: string }
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [actionDone, setActionDone] = useState<'approved' | 'rejected' | null>(null)

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setBooking(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthed(true)
    } else {
      setLoginError('סיסמה שגויה')
    }
  }

  async function handleAction(status: 'approved' | 'rejected') {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setActionDone(status)
    setBooking((b) => b ? { ...b, status } : null)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-sm mx-auto px-4 py-20 text-center text-gray-500">
          טוען...
        </main>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-sm mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">❓</div>
          <p className="text-gray-500">הזמנה לא נמצאה</p>
        </main>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-sm mx-auto px-4 py-12 space-y-6">
          {/* Show booking summary even before login */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <h3 className="text-white font-bold text-lg mb-3">הזמנה לאישור</h3>
            <div className="text-gray-700 space-y-1">
              <div className="text-xl font-bold text-white">{booking.pilot_name}</div>
              <div>📅 {booking.date}</div>
              <div>🕐 {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</div>
              {booking.with_instructor && <div>👨‍✈️ מדריך: {booking.instructor_name}</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-white font-bold text-center mb-4">🔐 הכנס סיסמת מנהל</h3>
            <form onSubmit={login} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-lg text-center"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-colors"
              >
                כניסה
              </button>
              {loginError && (
                <p className="text-red-400 text-center text-sm">{loginError}</p>
              )}
            </form>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-sm mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-white font-bold text-xl text-center">אישור הזמנה</h3>

          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-white">{booking.pilot_name}</div>
            <div className="text-gray-700">📅 {booking.date}</div>
            <div className="text-gray-700">
              🕐 {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
            </div>
            {booking.with_instructor && (
              <div className="text-gray-700">👨‍✈️ מדריך: {booking.instructor_name}</div>
            )}

            <div className={`inline-block mt-2 px-3 py-1 rounded text-sm font-medium ${
              booking.status === 'approved' ? 'bg-green-500/20 text-green-300' :
              booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }`}>
              {booking.status === 'approved' ? '✅ מאושר' : booking.status === 'pending' ? '⏳ ממתין' : '❌ נדחה'}
            </div>
          </div>

          {actionDone ? (
            <div className={`text-center p-4 rounded-lg ${
              actionDone === 'approved'
                ? 'bg-green-500/20 border border-green-500/50 text-green-200'
                : 'bg-red-500/20 border border-red-500/50 text-red-200'
            }`}>
              {actionDone === 'approved' ? 'ההזמנה אושרה בהצלחה! ✅' : 'ההזמנה נדחתה ❌'}
            </div>
          ) : booking.status === 'pending' ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAction('approved')}
                className="py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg transition-colors"
              >
                ✅ אשר
              </button>
              <button
                onClick={() => handleAction('rejected')}
                className="py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg transition-colors"
              >
                ❌ דחה
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-500">הזמנה זו כבר טופלה.</p>
          )}
        </div>
      </main>
    </div>
  )
}
