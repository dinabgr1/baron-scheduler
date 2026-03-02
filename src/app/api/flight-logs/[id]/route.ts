export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()
  const body = await request.json()

  const {
    hobbs_start,
    hobbs_end,
    flight_time_hours,
    flight_time_minutes,
    fuel_added_liters,
    fuel_level_quarters,
    oil_engine1,
    oil_engine2,
    notes,
  } = body

  const updateData: Record<string, unknown> = {}
  if (hobbs_start !== undefined) updateData.hobbs_start = parseFloat(hobbs_start)
  if (hobbs_end !== undefined) updateData.hobbs_end = parseFloat(hobbs_end)
  if (flight_time_hours !== undefined) updateData.flight_time_hours = parseInt(flight_time_hours) || 0
  if (flight_time_minutes !== undefined) updateData.flight_time_minutes = parseInt(flight_time_minutes) || 0
  if (fuel_added_liters !== undefined) updateData.fuel_added_liters = parseFloat(fuel_added_liters) || 0
  if (fuel_level_quarters !== undefined) updateData.fuel_level_quarters = parseInt(fuel_level_quarters) || 4
  if (oil_engine1 !== undefined) updateData.oil_engine1 = parseFloat(oil_engine1) || 0
  if (oil_engine2 !== undefined) updateData.oil_engine2 = parseFloat(oil_engine2) || 0
  if (notes !== undefined) updateData.notes = notes || null

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('flight_logs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Flight log not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
