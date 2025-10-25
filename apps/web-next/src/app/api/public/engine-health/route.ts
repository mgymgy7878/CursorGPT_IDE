import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const engineUrl = process.env.ENGINE_URL
  
  // Try real engine first, fallback to mock
  if (engineUrl) {
    try {
      const response = await fetch(`${engineUrl}/health`, {
        signal: AbortSignal.timeout(3000)
      })
      if (response.ok) {
        return NextResponse.json(await response.json())
      }
    } catch (error) {
      console.warn('[engine-health] Real endpoint failed, using mock:', error)
    }
  }
  
  // Mock fallback
  return NextResponse.json({
    status: 'OK',
    running: true,
    updatedAt: new Date().toISOString(),
    source: 'mock'
  })
}

