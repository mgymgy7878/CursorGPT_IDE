import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success:false, error: { message: 'Method not allowed' }});
  const { code } = (req.body ?? {}) as { code?: string };
  const issues: Array<{ severity: 'error'|'warn'; message: string }> = [];
  if (!code || typeof code !== 'string' || code.trim().length < 5) {
    issues.push({ severity:'error', message:'Code empty/too short' });
  }
  return res.status(200).json({ success:true, data: { issues } });
} 
