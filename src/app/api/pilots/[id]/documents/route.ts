export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()
  const { data: pilot } = await supabase.from('pilots').select('name').eq('id', id).single()
  if (!pilot) return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })
  const { data, error } = await supabase.from('pilot_documents').select('*').eq('pilot_name', pilot.name).order('expiry_date', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()
  const { data: pilot } = await supabase.from('pilots').select('name').eq('id', id).single()
  if (!pilot) return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })
  const body = await req.json()
  const { data, error } = await supabase.from('pilot_documents').insert({ ...body, pilot_name: pilot.name }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id: docId, ...updates } = body
  const { data, error } = await getServiceClient().from('pilot_documents').update(updates).eq('id', docId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const docId = searchParams.get('doc_id')
  if (!docId) return NextResponse.json({ error: 'doc_id required' }, { status: 400 })
  const { error } = await getServiceClient().from('pilot_documents').delete().eq('id', docId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
