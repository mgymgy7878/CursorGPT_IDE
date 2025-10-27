import type { NextApiRequest, NextApiResponse } from "next";

const BASE = process.env.NEXT_PUBLIC_EXECUTOR_BASE || "http://127.0.0.1:4001";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = typeof req.body === "string" ? JSON.parse(req.body||"{}") : (req.body||{});
  const payload = { package: body.package ?? "v1.1", traffic: Number(body.traffic ?? 50),
                    guardrails: !!body.guardrails, requestedAt: new Date().toISOString() };
  try {
    const fwd = await fetch(`${BASE}/canary/confirm`, { method:"POST", headers:{ "content-type":"application/json" },
                    body: JSON.stringify(payload) });
    if (fwd.ok) return res.status(200).send(await fwd.text());
  } catch {}
  return res.status(202).json({ status:"accepted", confirm_required:true, reason:"UI stub (pages)", executorBase: BASE, payload });
}
