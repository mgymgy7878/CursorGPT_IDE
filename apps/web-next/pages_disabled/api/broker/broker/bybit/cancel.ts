import type { NextApiRequest, NextApiResponse } from "next"
import BybitService from "../../../../server/bybit"
import { loadBybitCreds } from "../../../../server/creds"
import { logInfo, logWarn, logError } from "../../../../server/log"
import { requireJWTOrApiKey } from "../../_mwAuth"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireJWTOrApiKey(req, res).ok) return
  try {
    if (req.method !== 'POST') return res.status(405).json({ success:false, error:{ message:'Method not allowed' } })
    const { symbol, orderId } = req.body || {}
    if (!symbol || !orderId) return res.status(400).json({ success:false, error:{ message:'symbol/orderId required' } })

    const creds = loadBybitCreds()
    if (!creds) return res.status(200).json({ success: true, data: { demo:true } })
    const svc = new BybitService({ apiKey: creds.apiKey, secretKey: creds.secretKey, testnet: creds.testnet, demo: creds.demo })
    const out = await svc.cancelOrder(symbol, String(orderId))
    logInfo('Bybit cancelOrder success %s %s', symbol, orderId)
    return res.status(200).json({ success:true, data: out })
  } catch (e:any) {
    if (e?.code === 429) logWarn('Bybit 429 rate limited during cancelOrder', { highlight:true })
    else logError('Bybit cancelOrder failed: %s', e?.message || e)
    return res.status(400).json({ success:false, error:{ message: e?.message || 'failed' } })
  }
} 
