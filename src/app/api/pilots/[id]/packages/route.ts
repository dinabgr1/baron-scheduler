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

  const { data, error } = await supabase
    .from('hour_packages')
    .select('*')
    .eq('pilot_name', pilot.name)
    .order('purchase_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: pilot, error: pilotErr } = await supabase
    .from('pilots')
    .select('id, name')
    .eq('id', id)
    .single()

  if (pilotErr || !pilot) {
    return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })
  }

  const body = await req.json()
  const pkg = {
    pilot_id: pilot.id,
    pilot_name: pilot.name,
    hours_purchased: parseFloat(body.hours_purchased),
    hours_used: 0,
    price_paid: body.price_paid ? parseFloat(body.price_paid) : null,
    purchase_date: body.purchase_date || new Date().toISOString().split('T')[0],
    notes: body.notes || null,
  }

  const { data, error } = await supabase
    .from('hour_packages')
    .insert(pkg)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
