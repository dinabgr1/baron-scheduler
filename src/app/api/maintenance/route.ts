export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = getServiceClient()
  const pilotsOnly = request.nextUrl.searchParams.get('pilots_only') === 'true'

  let query = supabase.from('maintenance_records').select('*')
  if (pilotsOnly) query = query.eq('visible_to_pilots', true)
  const { data: records, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: logs } = await supabase.from('flight_logs').select('hobbs_end').order('created_at', { ascending: false }).limit(1)
  const currentHobbs = logs?.[0]?.hobbs_end || 0
  return NextResponse.json({ records, currentHobbs })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  const { data, error } = await getServiceClient().from('maintenance_records').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await getServiceClient().from('maintenance_records').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await getServiceClient().from('maintenance_records').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
