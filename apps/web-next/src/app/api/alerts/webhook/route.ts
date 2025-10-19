import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { type = "slack", event, severity = "info", message } = body;
  
  if (!event || !message) {
    return NextResponse.json(
      { _err: "event and message required" }, 
      { status: 400 }
    );
  }
  
  try {
    // Mock webhook - in production this would call actual Slack/email service
    const webhookUrl = process.env.SLACK_WEBHOOK_URL || "https://hooks.slack.com/services/MOCK";
    
    const slackPayload = {
      text: `*[${severity.toUpperCase()}]* ${event}`,
      attachments: [
        {
          color: severity === "critical" ? "danger" : severity === "warning" ? "warning" : "good",
          text: message,
          footer: "Spark Trading Platform",
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
    
    // Mock HTTP call (in production: actual fetch to webhookUrl)
    const mockResponse = {
      ok: true,
      webhook: type,
      delivered: false, // Mock mode
      _mock: true,
      message: `Would send to ${type}: ${message}`
    };
    
    // Audit push
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "alerts.webhook",
        result: "ok",
        strategyId: "webhook",
        timestamp: Date.now(),
        details: `${type} webhook (mock): ${event} - ${message.slice(0, 50)}`
      })
    }).catch(() => {});
    
    return NextResponse.json(mockResponse, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { _err: `webhook-failed: ${e?.message ?? "unknown"}` }, 
      { status: 200 }
    );
  }
}

