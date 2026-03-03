'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type LoginLog = {
  id: string
  login_type: string
  user_name: string | null
  ip: string
  user_agent: string
  success: number
  created_at: string
}

function parseUA(ua: string): string {
  if (ua.includes('iPhone')) return '📱 iPhone'
  if (ua.includes('Android')) return '📱 Android'
  if (ua.includes('iPad')) return '📱 iPad'
  if (ua.includes('Mac')) return '💻 Mac'
  if (ua.includes('Windows')) return '💻 Windows'
  if (ua.includes('Linux')) return '💻 Linux'
  return '🌐 ' + ua.slice(0, 30)
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <form onSubmit={login} className="bg-white p-6 rounded-2xl shadow-sm border max-w-sm w-full space-y-4">
          <h2 className="text-xl font-bold text-center">🔐 כניסת מנהל</h2>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="סיסמה" className="w-full border rounded-xl px-4 py-3 text-center" autoFocus />
          <button className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold">כניסה</button>
        </form>
      </div>
    )
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400 text-lg">טוען...</div></div>
  }

  const adminLogs = logs.filter(l => l.login_type === 'admin')
  const pilotLogs = logs.filter(l => l.login_type === 'pilot')
  const failedLogs = logs.filter(l => !l.success)

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">📋 היסטוריית כניסות</h1>
            <p className="text-slate-500 text-sm">{logs.length} כניסות</p>
          </div>
          <Link href="/admin" className="text-blue-700 hover:text-blue-800 text-sm font-semibold">← חזרה לניהול</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{adminLogs.length}</div>
            <div className="text-xs text-slate-500">כניסות מנהל</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{pilotLogs.length}</div>
            <div className="text-xs text-slate-500">כניסות טייסים</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{failedLogs.length}</div>
            <div className="text-xs text-slate-500">ניסיונות כושלים</div>
          </div>
        </div>

        {/* Log List */}
        <div className="bg-white rounded-2xl shadow-sm border divide-y">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">אין כניסות עדיין</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  !log.success ? 'bg-red-100' : log.login_type === 'admin' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {!log.success ? '🚫' : log.login_type === 'admin' ? '🔑' : '✈️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {log.login_type === 'admin' ? 'מנהל' : log.user_name || 'טייס'}
                    </span>
                    {!log.success && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">נכשל</span>}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{parseUA(log.user_agent)}</span>
                    <span>·</span>
                    <span>{log.ip}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {timeAgo(log.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
