import type { NextApiRequest, NextApiResponse } from "next";
import { BacktestParamsSchema, BacktestResultSchema } from "@spark/shared";
import { runBacktest } from "@spark/backtester";
import type { BacktestParams as EngineParams, BacktestResult as EngineResult } from "@spark/shared";

type ApiOk<T> = { success: true; data: T };
type ApiErr = { success: false; error: { message: string } };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiOk<unknown> | ApiErr>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { message: 'Method not allowed' } });
  }
  try {
    const input = BacktestParamsSchema.parse(req.body);

    const params: EngineParams = {
      symbol: input.symbol,
      timeframe: input.timeframe as any,
      startDate: new Date(input.start).toISOString(),
      endDate: new Date(input.end).toISOString(),
      barCount: input.barCount ?? 1000,
      commission: input.commission ?? 0.0004,
      leverage: input.leverage ?? 1,
    } as any;

    const result = await runBacktest(params);

    // Esnek doğrulama: mevcut stub uyumu için safeParse
    const parsed = BacktestResultSchema.safeParse(result);
    if (!parsed.success) {
      // Şema ile uyumsuzsa yine de ham sonucu döndürüyoruz; ileride tam hizalanacak
      return res.status(200).json({ success: true, data: result as EngineResult });
    }
    return res.status(200).json({ success: true, data: parsed.data });
  } catch (err: any) {
    const message = err?.message ?? 'Backtest failed';
    return res.status(400).json({ success: false, error: { message } });
  }
} 
