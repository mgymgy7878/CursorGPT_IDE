import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const promUrl = process.env.PROMETHEUS_URL
  
  // Try real Prometheus first, fallback to mock
  if (promUrl) {
    try {
      // Simple error rate query (last 5 minutes)
      const query = 'rate(http_requests_total{status=~"5.."}[5m])'
      const response = await fetch(
        `${promUrl}/api/v1/query?query=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(3000) }
      )
      
      if (response.ok) {
        const data = await response.json()
        // Calculate error budget from Prometheus response
        // This is simplified; real calculation would be more complex
        const errorRate = data.data?.result?.[0]?.value?.[1] || 0
        const errorBudget = Math.max(0, Math.min(1, 1 - parseFloat(errorRate)))
        
        return NextResponse.json({
          status: 'OK',
          errorBudget,
          updatedAt: new Date().toISOString(),
          source: 'prometheus'
        })
      }
    } catch (error) {
      console.warn('[error-budget] Prometheus failed, using mock:', error)
    }
  }
  
  // Mock fallback
  return NextResponse.json({
    status: 'OK',
    errorBudget: 0.98,
    updatedAt: new Date().toISOString(),
    source: 'mock'
  })
}
