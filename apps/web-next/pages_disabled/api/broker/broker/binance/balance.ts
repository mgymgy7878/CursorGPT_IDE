import type { NextApiRequest, NextApiResponse } from "next";
import BinanceService from "../../../../server/binance";
import { loadBinanceCreds } from "../../../../server/creds";
import { withRetry } from "../../../../server/util";
import { requireJWTOrApiKey } from "../../_mwAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireJWTOrApiKey(req, res).ok) return;
  try {
    const creds = loadBinanceCreds();
    if (!creds || creds.demo) return res.status(200).json({ success: true, data: null });
    const baseUrl = creds.testnet ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com';
    const binance = new BinanceService({ apiKey: creds.apiKey, secretKey: creds.secretKey, testnet: creds.testnet, baseUrl });
    const data = await withRetry(() => binance.getAccountInfo());
    return res.status(200).json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, error: { message: e?.message || 'failed' } });
  }
} 
