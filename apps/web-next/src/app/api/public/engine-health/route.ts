import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    running: true,
    updatedAt: new Date().toISOString()
  })
}

