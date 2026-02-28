import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getServiceClient()

  const { data: pilot, error: pilotErr } = await supabase
    .from('pilots')
    .select('name')
    .eq('id', params.id)
    .single()

  if (pilotErr || !pilot) {
    return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('billing_records')
    .select('*')
    .eq('pilot_name', pilot.name)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getServiceClient()

  const { data: pilot, error: pilotErr } = await supabase
    .from('pilots')
    .select('name')
    .eq('id', params.id)
    .single()

  if (pilotErr || !pilot) {
    return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })
  }

  const body = await req.json()
  const record = {
    ...body,
    pilot_name: pilot.name,
  }

  const { data, error } = await supabase
    .from('billing_records')
    .insert(record)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
