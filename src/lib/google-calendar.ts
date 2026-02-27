import { google } from 'googleapis'

function getCalendarClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}')

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })

  return google.calendar({ version: 'v3', auth })
}

export async function createCalendarEvent(params: {
  pilotName: string
  date: string
  startTime: string
  endTime: string
  withInstructor: boolean
  instructorName?: string
}) {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID!

  const summary = params.withInstructor
    ? `✈️ ${params.pilotName} + ${params.instructorName || 'מדריך'}`
    : `✈️ ${params.pilotName}`

  const description = [
    `טייס: ${params.pilotName}`,
    `מטוס: Baron 4X-DZJ`,
    params.withInstructor ? `מדריך: ${params.instructorName}` : '',
    `סטטוס: ממתין לאישור`,
  ].filter(Boolean).join('\n')

  const event = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description,
      start: {
        dateTime: `${params.date}T${params.startTime}:00`,
        timeZone: 'Asia/Jerusalem',
      },
      end: {
        dateTime: `${params.date}T${params.endTime}:00`,
        timeZone: 'Asia/Jerusalem',
      },
      colorId: '8', // grey for pending
    },
  })

  return event.data.id
}

export async function updateCalendarEvent(
  eventId: string,
  status: 'approved' | 'rejected',
  pilotName: string
) {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID!

  const existing = await calendar.events.get({ calendarId, eventId })

  const description = (existing.data.description || '').replace(
    /סטטוס: .*/,
    `סטטוס: ${status === 'approved' ? 'מאושר ✅' : 'נדחה ❌'}`
  )

  await calendar.events.update({
    calendarId,
    eventId,
    requestBody: {
      ...existing.data,
      description,
      colorId: status === 'approved' ? '2' : '11', // green or red
      summary: status === 'approved'
        ? (existing.data.summary || '').replace('✈️', '✅')
        : (existing.data.summary || '').replace('✈️', '❌'),
    },
  })
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID!

  await calendar.events.delete({ calendarId, eventId })
}
