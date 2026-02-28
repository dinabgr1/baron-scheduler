import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { createCalendarEvent } from '@/lib/google-calendar'
import { sendWhatsAppNotification } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = getServiceClient()
  const { searchParams } = new URL(request.url)
  const pilotName = searchParams.get('pilot_name')
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('bookings')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (pilotName) {
    query = query.ilike('pilot_name', `%${pilotName}%`)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (from) {
    query = query.gte('date', from)
  }
  if (to) {
    query = query.lte('date', to)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = getServiceClient()
  const body = await request.json()

  const { pilot_name, date, start_time, end_time, with_instructor, instructor_name } = body

  if (!pilot_name || !date || !start_time || !end_time) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // Create Google Calendar event
  let googleEventId: string | null = null
  try {
    googleEventId = await createCalendarEvent({
      pilotName: pilot_name,
      date,
      startTime: start_time,
      endTime: end_time,
      withInstructor: with_instructor,
      instructorName: instructor_name,
    }) || null
  } catch (error) {
    console.error('Google Calendar error:', error)
    // Continue without calendar event
  }

  // Save to database
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      pilot_name,
      date,
      start_time,
      end_time,
      with_instructor: with_instructor || false,
      instructor_name: with_instructor ? (instructor_name || 'Shani Segev') : null,
      status: 'pending',
      google_event_id: googleEventId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-create pilot if not exists
  try {
    const { data: existingPilot } = await supabase
      .from('pilots')
      .select('id')
      .eq('name', pilot_name)
      .maybeSingle()

    if (!existingPilot) {
      await supabase.from('pilots').insert({
        name: pilot_name,
        phone: body.phone || null,
        is_active: true,
      })
    }
  } catch (pilotErr) {
    console.error('Auto-create pilot error:', pilotErr)
  }

  // Send WhatsApp notification
  const origin = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000'
  const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`

  sendWhatsAppNotification({
    pilotName: pilot_name,
    date,
    startTime: start_time,
    endTime: end_time,
    withInstructor: with_instructor,
    instructorName: instructor_name,
    bookingId: data.id,
    approvalBaseUrl: baseUrl,
  })

  return NextResponse.json(data, { status: 201 })
}
