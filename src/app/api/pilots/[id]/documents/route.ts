export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbRun, dbFirst } from '@/lib/db'

export const dynamic = 'force-dynamic'

type PilotDoc = { id: string; pilot_id: string; doc_type: string; expiry_date: string|null; notes: string|null; created_at: string }

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data = await dbAll<PilotDoc>('SELECT * FROM pilot_documents WHERE pilot_id = ? ORDER BY doc_type', id)
  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pilotId } = await params
  const body = await request.json()
  const { doc_type, expiry_date, notes } = body
  if (!doc_type) return NextResponse.json({ error: 'Missing doc_type' }, { status: 400 })

  const id = crypto.randomUUID()
  await dbRun(
    'INSERT INTO pilot_documents (id, pilot_id, doc_type, expiry_date, notes) VALUES (?, ?, ?, ?, ?)',
    id, pilotId, doc_type, expiry_date || null, notes || null
  )
  const data = await dbFirst<PilotDoc>('SELECT * FROM pilot_documents WHERE id = ?', id)
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json()
  const { doc_id, ...updates } = body
  if (!doc_id) return NextResponse.json({ error: 'Missing doc_id' }, { status: 400 })
  const fields: string[] = []
  const values: unknown[] = []
  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`)
    values.push(val)
  }
  values.push(doc_id)
  await dbRun(`UPDATE pilot_documents SET ${fields.join(', ')} WHERE id = ?`, ...values)
  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json()
  const { doc_id } = body
  if (!doc_id) return NextResponse.json({ error: 'Missing doc_id' }, { status: 400 })
  await dbRun('DELETE FROM pilot_documents WHERE id = ?', doc_id)
  return NextResponse.json({ success: true })
}
