import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { data, error } = await getServiceClient().from('pilots').update(body).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await getServiceClient().from('pilots').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
