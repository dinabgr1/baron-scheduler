export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: pilot } = await supabase.from('pilots').select('*').eq('id', id).single()
  if (!pilot) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Get bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('pilot_name', pilot.name)
    .order('date', { ascending: false })

  const bookingIds = (bookings || []).map(b => b.id)

  // Get flight logs
  const { data: flightLogs } = bookingIds.length > 0
    ? await supabase.from('flight_logs').select('*').in('booking_id', bookingIds).order('created_at', { ascending: false })
    : { data: [] }

  // Get packages
  const { data: packages } = await supabase
    .from('hour_packages')
    .select('*')
    .eq('pilot_name', pilot.name)

  const totalPurchased = (packages || []).reduce((s: number, p: { hours_purchased: number }) => s + p.hours_purchased, 0)
  const totalFlightHours = (flightLogs || []).reduce((sum: number, log: { hobbs_end?: number; hobbs_start?: number; flight_time_hours?: number; flight_time_minutes?: number }) => {
    if (log.hobbs_end && log.hobbs_start) return sum + (log.hobbs_end - log.hobbs_start)
    return sum + (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
  }, 0)
  const remaining = Math.round((totalPurchased - totalFlightHours) * 10) / 10

  const flightRows = (flightLogs || []).map((log: { booking_id: string; hobbs_start: number; hobbs_end: number; flight_time_hours: number; flight_time_minutes: number; fuel_added_liters: number; notes?: string | null }) => {
    const booking = (bookings || []).find(b => b.id === log.booking_id)
    const duration = log.hobbs_end && log.hobbs_start ? Math.round((log.hobbs_end - log.hobbs_start) * 10) / 10 : (log.flight_time_hours || 0) + (log.flight_time_minutes || 0) / 60
    return `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${booking?.date || '-'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${log.hobbs_start} → ${log.hobbs_end}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${duration}h</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${log.fuel_added_liters || 0}L</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${log.notes || ''}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>סיכום טייס - ${pilot.name}</title>
  <style>
    @media print { body { margin: 0; } }
    body { font-family: Arial, sans-serif; color: #1f2937; margin: 20px; direction: rtl; }
    h1 { color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; }
    .info { display: flex; gap: 40px; margin: 16px 0; flex-wrap: wrap; }
    .info-item { }
    .info-label { color: #6b7280; font-size: 12px; }
    .info-value { font-size: 18px; font-weight: bold; }
    .stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
    .stat { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; min-width: 120px; }
    .stat-num { font-size: 28px; font-weight: 900; color: #1e3a5f; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th { background: #f3f4f6; padding: 8px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 11px; }
  </style>
</head>
<body>
  <h1>✈️ Baron 4X-DZJ — סיכום טייס</h1>
  <div class="info">
    <div class="info-item"><div class="info-label">שם</div><div class="info-value">${pilot.name}</div></div>
    <div class="info-item"><div class="info-label">טלפון</div><div class="info-value">${pilot.phone || '-'}</div></div>
    <div class="info-item"><div class="info-label">רישיון</div><div class="info-value">${pilot.license_number || '-'}</div></div>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-num">${Math.round(totalFlightHours * 10) / 10}</div><div class="stat-label">שעות טיסה</div></div>
    <div class="stat"><div class="stat-num">${totalPurchased}</div><div class="stat-label">שעות שנרכשו</div></div>
    <div class="stat"><div class="stat-num" style="color:${remaining >= 0 ? '#16a34a' : '#dc2626'}">${remaining}</div><div class="stat-label">יתרה</div></div>
    <div class="stat"><div class="stat-num">${(bookings || []).length}</div><div class="stat-label">טיסות</div></div>
  </div>
  <h2>היסטוריית טיסות</h2>
  <table>
    <thead><tr><th>תאריך</th><th>Hobbs</th><th>משך</th><th>דלק</th><th>הערות</th></tr></thead>
    <tbody>${flightRows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9ca3af">אין טיסות</td></tr>'}</tbody>
  </table>
  <div class="footer">הופק ב-${new Date().toLocaleDateString('he-IL')} | Baron Scheduler</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
