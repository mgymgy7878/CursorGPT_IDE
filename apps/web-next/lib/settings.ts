export type Settings = {
  ai?: {
    provider?: "OpenAI" | "Anthropic" | "Groq" | "OpenRouter";
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  };
  binance?: {
    spot?: {
      useTestnet?: boolean; // UI seçimi
      live?: { apiKey?: string; secret?: string; };
      testnet?: { apiKey?: string; secret?: string; };
    };
    futures?: {
      useTestnet?: boolean; // UI seçimi
      live?: { apiKey?: string; secret?: string; };
      testnet?: { apiKey?: string; secret?: string; };
    };
  };
};

export const deepMerge = <T>(a: T, b: Partial<T>): T => {
  if (Array.isArray(a) || Array.isArray(b as any)) return (b as T) ?? a;
  if (typeof a === "object" && typeof b === "object" && a && b) {
    const out: any = { ...a };
    for (const k of Object.keys(b as any)) {
      out[k] = deepMerge((a as any)[k], (b as any)[k]);
    }
    return out;
  }
  return (b as T) ?? a;
};