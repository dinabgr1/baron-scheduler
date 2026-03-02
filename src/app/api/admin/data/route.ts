export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getServiceClient()

  const [bookings, pilots, flightLogs, packages, rates, maintenance] = await Promise.all([
    supabase.from('bookings').select('*').order('date', { ascending: false }),
    supabase.from('pilots').select('*').order('name'),
    supabase.from('flight_logs').select('*').order('created_at', { ascending: false }),
    supabase.from('hour_packages').select('*').order('purchase_date', { ascending: false }),
    supabase.from('rates').select('*').eq('is_active', true),
    supabase.from('maintenance_records').select('*'),
  ])

  const currentHobbs = flightLogs.data?.[0]?.hobbs_end || 0

  return NextResponse.json({
    bookings: bookings.data || [],
    pilots: pilots.data || [],
    flightLogs: flightLogs.data || [],
    packages: packages.data || [],
    rates: rates.data || [],
    maintenance: { records: maintenance.data || [], currentHobbs },
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
  })
}
