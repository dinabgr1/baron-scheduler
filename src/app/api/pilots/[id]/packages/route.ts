export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { dbAll, dbFirst } from '@/lib/db'
import type { HourPackage, Pilot } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const pilot = await dbFirst<Pilot>('SELECT * FROM pilots WHERE id = ?', id)
  if (!pilot) return NextResponse.json({ error: 'Pilot not found' }, { status: 404 })
  const data = await dbAll<HourPackage>('SELECT * FROM hour_packages WHERE pilot_name = ? ORDER BY purchase_date DESC', pilot.name)
  return NextResponse.json(data)
}
