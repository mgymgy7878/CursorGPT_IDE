import { z } from "zod";

export const GenerateInput = z.object({
  pair: z.string().min(5),
  tf: z.enum(["1m","5m","15m","1h","4h","1d"]),
  style: z.string().optional(),
  risk: z.object({
    maxDrawdown: z.number().min(0).max(0.5).default(0.1),
    maxNotional: z.number().min(0).default(1000)
  }).optional()
});

export type GenerateInputT = z.infer<typeof GenerateInput>;
