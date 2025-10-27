import type { NextApiRequest, NextApiResponse } from "next";
import BinanceService from "../../../../server/binance";
import { loadBinanceCreds } from "../../../../server/creds";
import { requireJWTOrApiKey } from "../../_mwAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireJWTOrApiKey(req, res).ok) return;
  try {
    const symbol = (req.query.symbol as string) || undefined;
    const creds = loadBinanceCreds();
    if (!creds || creds.demo) return res.status(200).json({ success: true, data: [] });
    const baseUrl = creds.testnet ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com';
    const binance = new BinanceService({ apiKey: creds.apiKey, secretKey: creds.secretKey, testnet: creds.testnet, baseUrl });
    const data = await binance.getOpenOrders(symbol);
    return res.status(200).json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, error: { message: e?.message || 'failed' } });
  }
} 
