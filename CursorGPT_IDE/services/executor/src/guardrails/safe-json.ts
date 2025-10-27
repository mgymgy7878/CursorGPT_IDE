/**
 * Safe JSON stringify for tool payloads.
 * Handles BigInt, NaN/Infinity, undefined, circular references, and long strings.
 * 
 * @fileoverview Prevents serialization errors in Chat/Agent tool calls
 * @author Spark Trading Platform
 * @version 1.0.0
 */

export interface SafeJsonOpts {
  /** Maximum string size in KB (default: 100) */
  maxStringKB?: number;
  /** Marker for circular references (default: "<circular>") */
  circularMarker?: string;
  /** Marker for trimmed strings (default: "<trimmed>") */
  trimMarker?: string;
}

/**
 * Safely stringify an object, handling problematic values that cause serialization errors.
 * 
 * @param input - The object to stringify
 * @param opts - Configuration options
 * @returns Safe JSON string
 * 
 * @example
 * ```typescript
 * const data = {
 *   id: 12345678901234567890n,  // BigInt
 *   value: NaN,                 // NaN
 *   inf: Infinity,             // Infinity
 *   msg: "x".repeat(200000)    // Long string
 * };
 * data.self = data;            // Circular reference
 * 
 * const safe = safeStringify(data);
 * // Result: {"id":"12345678901234567890","value":null,"inf":null,"msg":"xxxx...<trimmed>","self":"<circular>"}
 * ```
 */
export function safeStringify(input: unknown, opts: SafeJsonOpts = {}): string {
  const seen = new WeakSet<object>();
  const maxBytes = (opts.maxStringKB ?? 100) * 1024;
  const trimMarker = opts.trimMarker ?? "<trimmed>";
  const circularMarker = opts.circularMarker ?? "<circular>";

  /**
   * Calculate byte length of a string in UTF-8
   */
  function toBytes(s: string): number {
    return Buffer.byteLength(s, "utf8");
  }

  /**
   * Replacer function for JSON.stringify that handles problematic values
   */
  const replacer = (_key: string, value: any): any => {
    // Handle BigInt - convert to string
    if (typeof value === "bigint") {
      return value.toString();
    }

    // Handle NaN and Infinity - convert to null
    if (typeof value === "number" && !Number.isFinite(value)) {
      return null;
    }

    // Handle undefined - JSON.stringify drops it anyway, but be explicit
    if (value === undefined) {
      return undefined; // JSON.stringify will drop this
    }

    // Handle circular references
    if (value && typeof value === "object") {
      if (seen.has(value)) {
        return circularMarker;
      }
      seen.add(value);
    }

    // Handle long strings - trim to maxStringKB
    if (typeof value === "string" && toBytes(value) > maxBytes) {
      // Preserve tail context if useful (last 16 chars)
      const head = value.slice(0, Math.max(0, value.length - 16));
      return head + trimMarker;
    }

    return value;
  };

  try {
    return JSON.stringify(input, replacer);
  } catch (error) {
    // Fallback: if stringify still fails, return error representation
    return JSON.stringify({
      error: "serialization_failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Validate that a string can be safely serialized
 * @param input - The input to validate
 * @returns True if safe to serialize
 */
export function isSafeToSerialize(input: unknown): boolean {
  try {
    JSON.stringify(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get serialization size estimate in bytes
 * @param input - The input to measure
 * @returns Estimated byte size
 */
export function getSerializationSize(input: unknown): number {
  try {
    const json = JSON.stringify(input);
    return Buffer.byteLength(json, "utf8");
  } catch {
    return 0;
  }
}
