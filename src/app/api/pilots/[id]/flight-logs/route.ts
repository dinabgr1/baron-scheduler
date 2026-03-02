export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: pilot, error: pilotErr } = await supabase
    .from('pilots')
    .select('name')
    .eq('id', id)
    .single()

  if (pilotErr || !pilot) {
    return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })
  }

  // Get all bookings for this pilot, then join flight_logs
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('pilot_name', pilot.name)

  if (!bookings || bookings.length === 0) {
    return NextResponse.json([])
  }

  const bookingIds = bookings.map(b => b.id)

  const { data, error } = await supabase
    .from('flight_logs')
    .select('*, bookings(*)')
    .in('booking_id', bookingIds)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
