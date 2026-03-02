export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()
  const body = await request.json()

  // Get existing booking for calendar update
  const { data: existing } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Update calendar if status changed
  if (body.status && body.status !== existing.status && existing.google_event_id) {
    try {
      await updateCalendarEvent(
        existing.google_event_id,
        body.status,
        existing.pilot_name
      )
    } catch (error) {
      console.error('Calendar update error:', error)
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()

  // Get booking for calendar deletion
  const { data: existing } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (existing?.google_event_id) {
    try {
      await deleteCalendarEvent(existing.google_event_id)
    } catch (error) {
      console.error('Calendar delete error:', error)
    }
  }

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
