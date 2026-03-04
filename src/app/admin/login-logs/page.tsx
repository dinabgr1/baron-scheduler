'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

type LoginLog = {
  id: string
  login_type: string
  user_name: string | null
  ip: string
  user_agent: string
  success: number
  created_at: string
  city: string | null
  country: string | null
  referrer: string | null
  screen_size: string | null
  timezone: string | null
  connection: string | null
  language: string | null
}

function parseUA(ua: string): string {
  if (ua.includes('iPhone')) return 'iPhone'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPad')) return 'iPad'
  if (ua.includes('Mac')) return 'Mac'
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Linux')) return 'Linux'
  return ua.slice(0, 30)
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דק׳`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `לפני ${hours} שע׳`
  const days = Math.floor(hours / 24)
  return `לפני ${days} ימים`
}

export default function LoginLogsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')

  async function login(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthed(true)
      loadLogs()
    }
  }

  async function checkAuth() {
    const res = await fetch('/api/admin/check')
    if (res.ok) {
      setAuthed(true)
      loadLogs()
    } else {
      setLoading(false)
    }
  }

  async function loadLogs() {
    const res = await fetch('/api/admin/login-logs?limit=200')
    if (res.ok) {
      const data = await res.json()
      setLogs(data)
    }
    setLoading(false)
  }

  useEffect(() => { checkAuth() }, [])

  if (!authed) {
    return (
      <div className="min-h-screen bg-baron-bg" dir="rtl">
        <Header />
        <main className="max-w-sm mx-auto px-4 pt-[68px] md:pt-[76px] pb-24 md:pb-12 flex items-center justify-center min-h-[60vh]">
          <form onSubmit={login} className="card rounded-xl md:rounded-2xl p-5 max-w-sm w-full space-y-4">
            <h2 className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em] text-center">כניסת מנהל</h2>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="סיסמה" className="w-full px-3 py-2 rounded-lg bg-white border border-baron-border text-baron-text placeholder-baron-muted text-sm focus:outline-none focus:border-baron-gold text-center" autoFocus />
            <button className="w-full py-3 rounded-lg gold-bg text-baron-text font-semibold text-[14px] hover:brightness-110 transition-all">כניסה</button>
          </form>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-baron-bg">
        <Header />
        <main className="max-w-3xl mx-auto px-4 pt-[68px] md:pt-[76px] pb-24 md:pb-12 flex items-center justify-center">
          <div className="text-baron-muted text-[14px]">טוען...</div>
        </main>
      </div>
    )
  }

  const adminLogs = logs.filter(l => l.login_type === 'admin')
  const pilotLogs = logs.filter(l => l.login_type === 'pilot')
  const viewLogs = logs.filter(l => l.login_type === 'view')
  const failedLogs = logs.filter(l => !l.success)

  return (
    <div className="min-h-screen bg-baron-bg" dir="rtl">
      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-[68px] md:pt-[76px] pb-24 md:pb-12 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-semibold text-[15px] leading-none text-baron-text">היסטוריית כניסות</h1>
            <p className="text-baron-muted text-[12px]">{logs.length} כניסות</p>
          </div>
          <Link href="/admin" className="text-baron-gold-text hover:brightness-110 text-[13px] font-semibold transition-all">חזרה לניהול</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card rounded-xl md:rounded-2xl p-4 text-center">
            <div className="text-[22px] font-bold text-baron-gold-text">{adminLogs.length}</div>
            <div className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em]">כניסות מנהל</div>
          </div>
          <div className="card rounded-xl md:rounded-2xl p-4 text-center">
            <div className="text-[22px] font-bold text-emerald-500">{pilotLogs.length}</div>
            <div className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em]">כניסות טייסים</div>
          </div>
          <div className="card rounded-xl md:rounded-2xl p-4 text-center">
            <div className="text-[22px] font-bold text-baron-text">{viewLogs.length}</div>
            <div className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em]">צפיות בדפים</div>
          </div>
          <div className="card rounded-xl md:rounded-2xl p-4 text-center">
            <div className="text-[22px] font-bold text-baron-red">{failedLogs.length}</div>
            <div className="text-baron-muted text-[10px] md:text-[11px] font-medium uppercase tracking-[0.1em]">ניסיונות כושלים</div>
          </div>
        </div>

        {/* Log List */}
        <div className="card rounded-xl md:rounded-2xl divide-y divide-baron-border">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-baron-muted text-[13px]">אין כניסות עדיין</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-medium ${
                  !log.success ? 'bg-red-50 text-baron-red' : log.login_type === 'admin' ? 'bg-amber-50 text-baron-gold-text' : log.login_type === 'view' ? 'bg-baron-bg text-baron-muted' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {!log.success ? '!' : log.login_type === 'admin' ? 'A' : log.login_type === 'view' ? 'V' : 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[13px] text-baron-text">
                      {log.login_type === 'admin' ? 'מנהל' : log.login_type === 'view' ? `צפייה: ${log.user_name}` : log.user_name || 'טייס'}
                    </span>
                    {!log.success && <span className="text-[10px] bg-red-50 text-baron-red px-2 py-0.5 rounded-md font-medium border border-red-200">נכשל</span>}
                  </div>
                  <div className="text-[11px] text-baron-dim flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span>{parseUA(log.user_agent)}</span>
                    {log.city && <span>· {log.city}{log.country ? `, ${log.country}` : ''}</span>}
                    {!log.city && log.country && <span>· {log.country}</span>}
                    {log.screen_size && <span>· {log.screen_size}</span>}
                    {log.connection && <span>· {log.connection}</span>}
                    <span>· {log.ip}</span>
                  </div>
                </div>
                <div className="text-[11px] text-baron-dim whitespace-nowrap">
                  {timeAgo(log.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
