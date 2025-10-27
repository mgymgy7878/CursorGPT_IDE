import { NextRequest, NextResponse } from "next/server"

function handler(req: NextRequest) {
  if (process.env.DEV_REWRITE_OLD_ROUTES === '1') {
    const u = new URL(req.url)
    u.pathname = '/api/admin/supervisor/toggle'
    return NextResponse.redirect(u, 308)
  }
  return NextResponse.json(
    { ok: false, error: 'Route moved to /api/admin/supervisor/toggle' },
    { status: 410 }
  )
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler 
