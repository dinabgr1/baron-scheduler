'use client'
export const runtime = 'edge'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { Booking } from '@/lib/db'

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
      <div className="min-h-screen bg-baron-bg">
        <Header />
        <main className="max-w-sm mx-auto px-4 pt-[68px] md:pt-[76px] pb-24 md:pb-12 text-center text-baron-muted">
          טוען...
        </main>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-baron-bg">
        <Header />
        <main className="max-w-sm mx-auto px-4 pt-[68px] md:pt-[76px] pb-24 md:pb-12 text-center">
          <div className="text-5xl mb-4">?</div>
          <p className="text-baron-muted">הזמנה לא נמצאה</p>
        </main>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-baron-bg">
        <Header />
        <main className="max-w-sm mx-auto px-4 pt-[68px] md:pt-[76px] pb-24 md:pb-12 space-y-4">
          {/* Show booking summary even before login */}
          <div className="card rounded-xl md:rounded-2xl p-5 text-center space-y-3">
            <h3 className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em]">הזמנה לאישור</h3>
            <div className="space-y-1">
              <div className="text-[18px] font-bold text-baron-text">{booking.pilot_name}</div>
              <div className="text-[13px] text-baron-muted">{booking.date}</div>
              <div className="text-[13px] text-baron-muted">{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</div>
              {booking.with_instructor && <div className="text-[13px] text-baron-muted">מדריך: {booking.instructor_name}</div>}
            </div>
          </div>

          <div className="card rounded-xl md:rounded-2xl p-5">
            <h3 className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em] text-center mb-4">כניסת מנהל</h3>
            <form onSubmit={login} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה"
                className="w-full px-3 py-2 rounded-lg bg-white border border-baron-border text-baron-text placeholder-baron-muted text-sm focus:outline-none focus:border-baron-gold text-center"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg gold-bg text-baron-text font-semibold text-[14px] hover:brightness-110 transition-all"
              >
                כניסה
              </button>
              {loginError && (
                <p className="text-baron-red text-center text-sm">{loginError}</p>
              )}
            </form>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-baron-bg">
      <Header />
      <main className="max-w-sm mx-auto px-4 pt-[68px] md:pt-[76px] pb-24 md:pb-12">
        <div className="card rounded-xl md:rounded-2xl p-5 space-y-5">
          <h3 className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em] text-center">אישור הזמנה</h3>

          <div className="text-center space-y-2">
            <div className="text-[20px] font-bold text-baron-text">{booking.pilot_name}</div>
            <div className="text-[13px] text-baron-muted">{booking.date}</div>
            <div className="text-[13px] text-baron-muted">
              {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
            </div>
            {booking.with_instructor && (
              <div className="text-[13px] text-baron-muted">מדריך: {booking.instructor_name}</div>
            )}

            <div className={`inline-block mt-2 px-3 py-1 rounded-md text-[12px] font-medium ${
              booking.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
              booking.status === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
              'bg-red-50 text-baron-red border border-red-200'
            }`}>
              {booking.status === 'approved' ? 'מאושר' : booking.status === 'pending' ? 'ממתין' : 'נדחה'}
            </div>
          </div>

          {actionDone ? (
            <div className={`text-center p-4 rounded-lg text-[13px] font-medium ${
              actionDone === 'approved'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                : 'bg-red-50 border border-red-200 text-baron-red'
            }`}>
              {actionDone === 'approved' ? 'ההזמנה אושרה בהצלחה!' : 'ההזמנה נדחתה'}
            </div>
          ) : booking.status === 'pending' ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAction('approved')}
                className="py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[14px] transition-colors"
              >
                אשר
              </button>
              <button
                onClick={() => handleAction('rejected')}
                className="py-3 rounded-lg bg-baron-red hover:brightness-110 text-white font-semibold text-[14px] transition-all"
              >
                דחה
              </button>
            </div>
          ) : (
            <p className="text-center text-baron-muted text-[13px]">הזמנה זו כבר טופלה.</p>
          )}
        </div>
      </main>
    </div>
  )
}
