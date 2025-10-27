import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Global error handling middleware
export function middleware(request: NextRequest) {
  try {
    // Basic request logging for debugging
    console.log(`${request.method} ${request.nextUrl.pathname}`)
    
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
  ],
}