import { NextRequest, NextResponse } from "next/server";
import { verifyToken, readCookie } from "../../../../../../lib/auth";
import { hasPermission } from "../../../../../../lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth kontrolü
    const token = readCookie(request);
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Read permission kontrolü
    if (!hasPermission(payload.role.toLowerCase(), "read")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const executionId = params.id;

    // SSE headers
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    };

    // Mock SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial connection event
        const sendEvent = (data: any) => {
          const event = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        sendEvent({
          type: 'connected',
          executionId,
          timestamp: new Date().toISOString()
        });

        // Simulate execution updates
        const interval = setInterval(() => {
          sendEvent({
            type: 'execution:update',
            executionId,
            data: {
              status: 'live',
              lastUpdate: new Date().toISOString()
            }
          });
        }, 1000);

        // Simulate trade events
        const tradeInterval = setInterval(() => {
          sendEvent({
            type: 'trade:filled',
            executionId,
            data: {
              tradeId: `trade_${Date.now()}`,
              symbol: 'BTCUSDT',
              side: 'BUY',
              qty: 0.00012,
              price: 45000 + Math.random() * 100,
              timestamp: new Date().toISOString()
            }
          });
        }, 3000);

        // Heartbeat
        const heartbeat = setInterval(() => {
          sendEvent({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });
        }, 20000);

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          clearInterval(tradeInterval);
          clearInterval(heartbeat);
          controller.close();
        });
      }
    });

    return new NextResponse(stream, { headers });

  } catch (error) {
    console.error("SSE stream error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
} 