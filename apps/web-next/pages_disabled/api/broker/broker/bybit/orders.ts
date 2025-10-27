import type { NextApiRequest, NextApiResponse } from "next";
import BybitService from "../../../../server/bybit";
import { loadBybitCreds } from "../../../../server/creds";
import { withRetry } from "../../../../server/util";
import { requireJWTOrApiKey } from "../../_mwAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireJWTOrApiKey(req, res).ok) return;
  try {
    const symbol = (req.query.symbol as string) || undefined;
    const creds = loadBybitCreds();
    if (!creds) return res.status(200).json({ success:true, data: [] });
    const baseUrl = creds.testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
    const svc = new BybitService({ apiKey: creds.apiKey, secretKey: creds.secretKey, testnet: creds.testnet, baseUrl, demo: creds.demo });
    const data = await withRetry(() => svc.getOpenOrders(symbol));
    return res.status(200).json({ success:true, data });
  } catch (e:any) {
    return res.status(400).json({ success:false, error:{ message: e?.message || 'failed' } });
  }
} 
