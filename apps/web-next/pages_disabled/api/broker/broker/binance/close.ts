import type { NextApiRequest, NextApiResponse } from "next";
import BinanceService from "../../../../server/binance";
import { loadBinanceCreds } from "../../../../server/creds";
import { requireJWTOrApiKey } from "../../_mwAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireJWTOrApiKey(req, res).ok) return;
  try {
    if (req.method !== 'POST') return res.status(405).json({ success:false, error:{ message:'Method not allowed' } });
    const { symbol, side, quantity } = req.body || {};
    if (!symbol || !side || !quantity) return res.status(400).json({ success:false, error:{ message:'symbol/side/quantity required' } });

    const creds = loadBinanceCreds();
    if (!creds || creds.demo) return res.status(200).json({ success: true, data: { demo:true } });
    const baseUrl = creds.testnet ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com';
    const binance = new BinanceService({ apiKey: creds.apiKey, secretKey: creds.secretKey, testnet: creds.testnet, baseUrl });

    // Market kapat: LONG ise SELL, SHORT ise BUY
    const binanceSide = side === 'LONG' ? 'SELL' : 'BUY';
    const out = await binance.placeMarketOrder({ symbol, side: binanceSide as any, type: 'MARKET', quantity: Number(quantity) });
    console.log('[INFO] Binance closePosition success', { symbol, side, quantity });
    return res.status(200).json({ success:true, data: out });
  } catch (e: any) {
    if (e?.code === 429) {
      console.warn('[WARN] Binance 429 rate limited during closePosition');
    } else {
      console.error('[ERROR] Binance closePosition failed', e?.message || e);
    }
    return res.status(400).json({ success:false, error:{ message: e?.message || 'failed' } });
  }
} 
