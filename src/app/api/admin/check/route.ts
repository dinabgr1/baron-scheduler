export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('admin_auth')
  if (cookie?.value === 'true') {
    return NextResponse.json({ authed: true })
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
