export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbFirst, dbRun } from '@/lib/db'
import type { HourPackage } from '@/lib/db'

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
  await dbRun(`UPDATE hour_packages SET ${fields.join(', ')} WHERE id = ?`, ...values)
  const data = await dbFirst<HourPackage>('SELECT * FROM hour_packages WHERE id = ?', id)
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await dbRun('DELETE FROM hour_packages WHERE id = ?', id)
  return NextResponse.json({ success: true })
}
