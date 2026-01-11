/**
 * Executor Health Proxy Endpoint
 *
 * Proxies executor health check to avoid CORS issues.
 * Client calls this instead of directly calling 127.0.0.1:4001/healthz
 *
 * GET /api/executor-healthz
 */

import { NextResponse } from 'next/server'

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001'

export async function GET() {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2s timeout

    const response = await fetch(`${EXECUTOR_URL}/healthz`, {
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeoutId)

    const latencyMs = Date.now() - startTime

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          latencyMs
        },
        { status: 200 } // Always 200 for UI (error in body)
      )
    }

    const data = await response.json()

    return NextResponse.json({
      ok: true,
      status: 'ok',
      service: data.service || 'executor',
      latencyMs,
      timestamp: data.ts || Date.now(),
    })
  } catch (error: any) {
    const latencyMs = Date.now() - startTime

    return NextResponse.json(
      {
        ok: false,
        error: error.name === 'AbortError' ? 'timeout' : error.message || 'unknown',
        latencyMs,
      },
      { status: 200 } // Always 200 for UI (error in body)
    )
  }
}

