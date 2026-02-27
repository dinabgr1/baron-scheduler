import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = getServiceClient()
  const { searchParams } = new URL(request.url)
  const bookingId = searchParams.get('booking_id')

  let query = supabase
    .from('flight_logs')
    .select('*, bookings(*)')
    .order('created_at', { ascending: false })

  if (bookingId) {
    query = query.eq('booking_id', bookingId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = getServiceClient()
  const body = await request.json()

  const {
    booking_id,
    hobbs_start,
    hobbs_end,
    flight_time_hours,
    flight_time_minutes,
    fuel_added_liters,
    fuel_level_quarters,
    oil_engine1,
    oil_engine2,
    notes,
  } = body

  if (!booking_id || hobbs_start === undefined || hobbs_end === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('flight_logs')
    .insert({
      booking_id,
      hobbs_start: parseFloat(hobbs_start),
      hobbs_end: parseFloat(hobbs_end),
      flight_time_hours: parseInt(flight_time_hours) || 0,
      flight_time_minutes: parseInt(flight_time_minutes) || 0,
      fuel_added_liters: parseFloat(fuel_added_liters) || 0,
      fuel_level_quarters: parseInt(fuel_level_quarters) || 4,
      oil_engine1: parseFloat(oil_engine1) || 0,
      oil_engine2: parseFloat(oil_engine2) || 0,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
