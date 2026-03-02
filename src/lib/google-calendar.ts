// Edge-compatible Google Calendar integration using fetch + JWT

async function getAccessToken(): Promise<string | null> {
  const credStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!credStr) return null
  try {
    const creds = JSON.parse(credStr)
    const now = Math.floor(Date.now() / 1000)
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const claim = btoa(JSON.stringify({
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const input = `${header}.${claim}`

    // Import private key for signing
    const pemKey = creds.private_key.replace(/\\n/g, '\n')
    const keyData = pemKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '')
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8', binaryKey.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    )
    const encoder = new TextEncoder()
    const sigBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(input))
    const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const jwt = `${input}.${sig}`

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    })
    const data = await res.json() as { access_token?: string }
    return data.access_token || null
  } catch (e) {
    console.error('Google auth error:', e)
    return null
  }
}

export async function createCalendarEvent(params: {
  pilotName: string; date: string; startTime: string; endTime: string;
  withInstructor: boolean; instructorName?: string
}): Promise<string | undefined> {
  const token = await getAccessToken()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!token || !calendarId) return undefined

  const summary = params.withInstructor
    ? `✈️ ${params.pilotName} + ${params.instructorName || 'מדריך'}`
    : `✈️ ${params.pilotName}`

  const description = [`טייס: ${params.pilotName}`, 'מטוס: Baron 4X-DZJ',
    params.withInstructor ? `מדריך: ${params.instructorName}` : '', 'סטטוס: ממתין לאישור'].filter(Boolean).join('\n')

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary, description, colorId: '8',
      start: { dateTime: `${params.date}T${params.startTime}:00`, timeZone: 'Asia/Jerusalem' },
      end: { dateTime: `${params.date}T${params.endTime}:00`, timeZone: 'Asia/Jerusalem' },
    }),
  })
  const data = await res.json() as { id?: string }
  return data.id
}

export async function updateCalendarEvent(eventId: string, status: 'approved' | 'rejected', pilotName: string): Promise<void> {
  const token = await getAccessToken()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!token || !calendarId) return

  const getRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const existing = await getRes.json() as { summary?: string; description?: string }
  const description = (existing.description || '').replace(/סטטוס: .*/, `סטטוס: ${status === 'approved' ? 'מאושר ✅' : 'נדחה ❌'}`)
  const summary = status === 'approved'
    ? (existing.summary || '').replace('✈️', '✅')
    : (existing.summary || '').replace('✈️', '❌')

  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...existing, summary, description, colorId: status === 'approved' ? '2' : '11' }),
  })
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const token = await getAccessToken()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!token || !calendarId) return

  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}
