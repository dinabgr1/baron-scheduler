import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = getServiceClient()
  const { searchParams } = new URL(request.url)
  const bookingId = searchParams.get('booking_id')

  if (!bookingId) {
    return NextResponse.json({ error: 'booking_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('preflight_checklists')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = getServiceClient()
  const body = await request.json()
  const { booking_id, pilot_name, checklist_data } = body

  if (!booking_id || !checklist_data) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('preflight_checklists')
    .insert({
      booking_id,
      pilot_name: pilot_name || null,
      checklist_data,
      completed: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
