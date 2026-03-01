import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('admin_auth')
  if (cookie?.value === 'true') {
    return NextResponse.json({ authed: true })
  }
  return NextResponse.json({ authed: false }, { status: 401 })
}
