import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ success:false, error:{ message: 'Method not allowed' } });
    const { prompt, action, code } = (req.body ?? {}) as { prompt?: string; action?: string; code?: string };
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ success:false, error:{ message:'prompt required' } });

    const baseParams = { fast: 50, slow: 200, rsi: 14 };
    const params = action === 'improve'
      ? { ...baseParams, rsi: 12 }
      : baseParams;

    const header = `//@params ${JSON.stringify(params)}\n`;
    const outCode = action === 'fix' && typeof code === 'string'
      ? `${header}${code}`
      : `${header}// SMA50/200 + RSI dummy strategy\nexport function strategy(series){ /* ... */ return { entrySignals: [], exitSignals: [] }; }\n`;

    return res.status(200).json({ success:true, data: { code: outCode, params } });
  } catch (e: any) {
    return res.status(400).json({ success:false, error:{ message: e?.message ?? 'assistant failed' } });
  }
} 
