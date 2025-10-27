import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success:false, error: { message: 'Method not allowed' }});
  return res.status(200).json({ success:true, data: { diagnostics: [] } });
} 
