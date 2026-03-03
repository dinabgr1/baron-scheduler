export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbFirst, dbRun } from '@/lib/db'
import type { Rate } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const fields: string[] = []
  const values: unknown[] = []
  for (const [key, val] of Object.entries(body)) {
    if (key === 'id') continue
    fields.push(`${key} = ?`)
    values.push(val)
  }
  values.push(id)
  await dbRun(`UPDATE rates SET ${fields.join(', ')} WHERE id = ?`, ...values)
  const data = await dbFirst<Rate>('SELECT * FROM rates WHERE id = ?', id)
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await dbRun('DELETE FROM rates WHERE id = ?', id)
  return NextResponse.json({ success: true })
}
