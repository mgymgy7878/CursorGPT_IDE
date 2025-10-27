import type { NextApiRequest, NextApiResponse } from "next";
import { loadBinanceCreds, saveBinanceCreds } from "../../../../server/creds";
import { requireJWTOrApiKey } from "../../_mwAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireJWTOrApiKey(req, res, ['admin']).ok) return;
  try {
    if (req.method === 'GET') {
      const data = loadBinanceCreds();
      return res.status(200).json({ success:true, data });
    }
    if (req.method === 'POST') {
      const { apiKey, secretKey, testnet, demo } = req.body || {};
      const current = loadBinanceCreds() || { apiKey:'', secretKey:'', testnet:false, demo:true };
      const next = {
        apiKey: apiKey ?? current.apiKey,
        secretKey: secretKey ?? current.secretKey,
        testnet: typeof testnet === 'boolean' ? testnet : current.testnet,
        demo: typeof demo === 'boolean' ? demo : current.demo,
      };
      saveBinanceCreds(next);
      return res.status(200).json({ success:true, data: { ok:true } });
    }
    return res.status(405).json({ success:false, error:{ message:'Method not allowed' } });
  } catch (e: any) {
    return res.status(400).json({ success:false, error:{ message: e?.message || 'failed' } });
  }
} 
