import type { NextApiRequest, NextApiResponse } from "next";
import OKXService from "../../../../server/okx";
import { loadOkxCreds } from "../../../../server/creds";
import { withRetry } from "../../../../server/util";
import { requireJWTOrApiKey } from "../../_mwAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireJWTOrApiKey(req, res).ok) return;
  try {
    const creds = loadOkxCreds();
    if (!creds) return res.status(200).json({ success:true, data: [] });
    const baseUrl = creds.testnet ? 'https://www.okx.com' : 'https://www.okx.com';
    const svc = new OKXService({ apiKey: creds.apiKey, secretKey: creds.secretKey, passphrase: creds.passphrase, testnet: creds.testnet, baseUrl, demo: creds.demo });
    const data = await withRetry(() => svc.getPositions());
    return res.status(200).json({ success:true, data });
  } catch (e:any) {
    return res.status(400).json({ success:false, error:{ message: e?.message || 'failed' } });
  }
} 
