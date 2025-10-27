import type { NextApiRequest, NextApiResponse } from "next";
import { WalkForwardRequestSchema, WalkForwardResultSchema } from "@spark/shared";
import { runWalkForward } from "../../../server/walkforward";

function rid() { return Math.random().toString(36).slice(2); }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ success:false, error:{ message: 'Method not allowed' } });
    const input = WalkForwardRequestSchema.parse(req.body);
    const runId = (req.query.runId as string) || rid();
    const result = await runWalkForward(input as any, runId);
    const data = WalkForwardResultSchema.parse(result);
    return res.status(200).json({ success:true, data });
  } catch (e: any) {
    return res.status(400).json({ success:false, error:{ message: e?.message ?? 'walkforward failed' } });
  }
} 
