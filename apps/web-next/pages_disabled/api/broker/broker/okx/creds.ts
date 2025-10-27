import type { NextApiRequest, NextApiResponse } from "next";
import { loadOkxCreds, saveOkxCreds } from "../../../../server/creds";
import { requireJWTOrApiKey } from "../../_mwAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireJWTOrApiKey(req, res, ['admin']).ok) return;
  try {
    if (req.method === 'GET') return res.status(200).json({ success:true, data: loadOkxCreds() });
    if (req.method === 'POST') {
      const { apiKey, secretKey, passphrase, testnet, demo } = req.body || {};
      const current = loadOkxCreds() || { apiKey:'', secretKey:'', passphrase:'', testnet:false, demo:true };
      saveOkxCreds({ apiKey: apiKey ?? current.apiKey, secretKey: secretKey ?? current.secretKey, passphrase: passphrase ?? current.passphrase, testnet: typeof testnet==='boolean'?testnet:current.testnet, demo: typeof demo==='boolean'?demo:current.demo });
      return res.status(200).json({ success:true, data:{ ok:true } });
    }
    return res.status(405).json({ success:false, error:{ message:'Method not allowed' } });
  } catch (e:any) {
    return res.status(400).json({ success:false, error:{ message:e?.message||'failed' } });
  }
} 
