import pLimit from "p-limit";

const limit = pLimit(Number(process.env.OUTBOUND_MAX_CONCURRENCY || 64));

export function withOutbound<T>(fn: () => Promise<T>): Promise<T> {
  return limit(fn);
}

// Convenience wrapper for common outbound operations
export async function outboundRequest<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await withOutbound(fn);
  } catch (error) {
    console.error(`[OUTBOUND] ${operation} failed:`, error);
    throw error;
  }
} 