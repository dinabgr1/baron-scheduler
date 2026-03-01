import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getServiceClient()
  // Get maintenance records
  const { data: records, error } = await supabase.from('maintenance_records').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get current hobbs (latest flight log hobbs_end)
  const { data: logs } = await supabase.from('flight_logs').select('hobbs_end').order('created_at', { ascending: false }).limit(1)
  const currentHobbs = logs?.[0]?.hobbs_end || 0

  return NextResponse.json({ records, currentHobbs })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  const { data, error } = await getServiceClient().from('maintenance_records').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await getServiceClient().from('maintenance_records').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
