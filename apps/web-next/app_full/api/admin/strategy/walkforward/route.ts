import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, audit } from "@spark/security";
import { extractBearer, verifyToken, isDevAuth } from "@spark/auth";
import { runWalkForward } from "../../../../../server/walkforward";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RL_LIMIT  = parseInt(process.env.RL_ADMIN_LIMIT || "30");
const RL_WINDOW = parseInt(process.env.RL_ADMIN_WINDOW_MS || "60000");
const STRICT    = process.env.STRICT_ADMIN_SCHEMA === "1";

type OptimizeBody = { strategyId?: string; code?: string; symbols?: string[]; tf?: string; params?: any };
function validateOptimize(b: any, strict: boolean): string | null {
  if (!b || typeof b !== "object") return "body must be an object";
  if (b.symbols && !Array.isArray(b.symbols)) return "symbols must be array";
  if (b.tf && typeof b.tf !== "string") return "tf must be string";
  if (strict) {
    if (!(typeof b.strategyId === "string" || typeof b.code === "string")) return "strategyId or code required";
    if (typeof b.tf !== "string") return "tf required";
  }
  return null;
}

type WalkBody = OptimizeBody & { splits?: number; oos?: number };
function validateWalk(b: any, strict: boolean): string | null {
  const e = validateOptimize(b, strict);
  if (e) return e;
  if (b.splits && typeof b.splits !== "number") return "splits must be number";
  if (b.oos && typeof b.oos !== "number")     return "oos must be number";
  return null;
}

function ipOf(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      || req.headers.get("x-real-ip")
      || "127.0.0.1";
}
async function parseJSON(req: NextRequest) { try { return await req.json() } catch { return undefined } }
function bad(msg: string, code=400) { return NextResponse.json({ ok:false, error: msg }, { status: code }) }
async function who(req: NextRequest) {
  let sub: string | undefined, role: string | undefined;
  if (isDevAuth()) { role = req.headers.get("x-dev-role") || "admin"; sub = req.headers.get("x-dev-sub") || "dev-user-1"; }
  else {
    const tok = extractBearer(req.headers.get("authorization"));
    if (tok) { try { const c = verifyToken(tok); sub=c.sub; role=c.role; } catch {} }
  }
  return { sub, role };
}

export async function POST(req: NextRequest) {
  const ip = ipOf(req);
  const rl = await enforceRateLimit(`admin:${req.nextUrl.pathname}:${ip}`, RL_LIMIT, RL_WINDOW);
  if (!rl.ok) return NextResponse.json({ ok:false, error:"Rate limit" }, { status:429, headers:{ "retry-after": Math.ceil((rl.retryAfterMs||1000)/1000).toString() } });

  const body = (await parseJSON(req)) as WalkBody | undefined;
  if (STRICT) {
    const err = validateWalk(body, true);
    if (err) return bad(err, 400);
  }

  try {
    const input = (body as any) ?? {};
    const runId = Math.random().toString(36).slice(2);
    const result = await runWalkForward(input, runId);

    const { sub, role } = await who(req);
    await audit({ ts: Date.now(), actor: sub, role, ip, method: "POST", path: req.nextUrl.pathname, status: 200, ok: true,
      meta: { op:"walkforward", strategyId: body?.strategyId, tf: body?.tf, symbols: Array.isArray(body?.symbols)? body!.symbols!.length : undefined }
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (e: any) {
    const { sub, role } = await who(req);
    await audit({ ts: Date.now(), actor: sub, role, ip, method: "POST", path: req.nextUrl.pathname, status: 500, ok: false, meta: { op:"walkforward", err: e?.message } });
    return NextResponse.json({ success: false, error: { message: e?.message || "walkforward failed" } }, { status: 500 });
  }
}

export async function GET()    { return bad("Method Not Allowed", 405) }
export async function PUT()    { return bad("Method Not Allowed", 405) }
export async function DELETE() { return bad("Method Not Allowed", 405) } 
