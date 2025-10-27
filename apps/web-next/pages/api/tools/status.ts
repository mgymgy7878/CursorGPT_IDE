import type { NextApiRequest, NextApiResponse } from "next";

const BASE = process.env.NEXT_PUBLIC_EXECUTOR_BASE || "http://127.0.0.1:4001";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const exH = await fetch(`${BASE}/health`).then(r => ({ ok:r.ok, status:r.status })).catch(()=>({ok:false,status:0}));
  const exM = await fetch(`${BASE}/metrics`).then(r => ({ ok:r.ok, status:r.status })).catch(()=>({ok:false,status:0}));
  res.status(exH.ok?200:503).json({ ok: exH.ok, base: BASE, executor:{ health:exH, metrics:exM }});
}
