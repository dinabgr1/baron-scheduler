export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()

  // First get the pilot name
  const { data: pilot, error: pilotErr } = await supabase
    .from('pilots')
    .select('name')
    .eq('id', id)
    .single()

  if (pilotErr || !pilot) {
    return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('pilot_name', pilot.name)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
