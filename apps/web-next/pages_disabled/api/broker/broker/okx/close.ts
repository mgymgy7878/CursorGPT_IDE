import type { NextApiRequest, NextApiResponse } from "next";
import OKXService from "../../../../server/okx";
import { loadOkxCreds } from "../../../../server/creds";
import { requireJWTOrApiKey } from "../../_mwAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireJWTOrApiKey(req, res).ok) return;
  try {
    if (req.method !== 'POST') return res.status(405).json({ success:false, error:{ message:'Method not allowed' } });
    const { symbol, side, quantity, price } = req.body || {};
    if (!symbol || !side || !quantity) return res.status(400).json({ success:false, error:{ message:'symbol/side/quantity required' } });

    const creds = loadOkxCreds();
    if (!creds) return res.status(200).json({ success: true, data: { demo:true } });
    const baseUrl = creds.testnet ? 'https://www.okx.com' : 'https://www.okx.com';
    const svc = new OKXService({ apiKey: creds.apiKey, secretKey: creds.secretKey, passphrase: creds.passphrase, testnet: creds.testnet, baseUrl, demo: creds.demo });

    const out = await svc.closePosition(symbol, side, Number(quantity), price!=null? Number(price): undefined);
    console.log('[INFO] OKX closePosition success', { symbol, side, quantity, price: price ?? null });
    return res.status(200).json({ success:true, data: out });
  } catch (e:any) {
    if (e?.code === 429) {
      console.warn('[WARN] OKX 429 rate limited during closePosition');
    } else {
      console.error('[ERROR] OKX closePosition failed', e?.message || e);
    }
    return res.status(400).json({ success:false, error:{ message: e?.message || 'failed' } });
  }
} 
