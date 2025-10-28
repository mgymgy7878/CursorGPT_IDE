/**
 * Payload guardrail for AI tool calls.
 * Sanitizes and limits payload size to prevent serialization errors.
 * 
 * @fileoverview Prevents large payload serialization errors in Chat/Agent
 * @author Spark Trading Platform
 * @version 1.0.0
 */

import { safeStringify } from "./safe-json.js";

export interface GuardrailOpts {
  /** Maximum payload size in KB (default: 256) */
  maxPayloadKB?: number;
  /** Maximum string size in KB (default: 100) */
  maxStringKB?: number;
}

export interface GuardrailResult {
  /** The sanitized JSON string */
  json: string;
  /** Final payload size in bytes */
  bytes: number;
  /** Whether payload was truncated */
  truncated: boolean;
  /** Warning messages about what was modified */
  warnings: string[];
}

/**
 * Apply guardrail to a payload, sanitizing and limiting size.
 * 
 * @param payload - The payload to process
 * @param opts - Configuration options
 * @returns Guardrail result with sanitized JSON
 * 
 * @example
 * ```typescript
 * const bigPayload = {
 *   msg: "x".repeat(500000),  // 500KB string
 *   items: Array(1000).fill("item"),  // Large array
 *   id: 12345678901234567890n  // BigInt
 * };
 * 
 * const result = guardrailSerialize(bigPayload);
 * console.log(result.truncated); // true
 * console.log(result.warnings); // ["payload trimmed"]
 * ```
 */
export function guardrailSerialize(payload: unknown, opts: GuardrailOpts = {}): GuardrailResult {
  const maxPayload = (opts.maxPayloadKB ?? 256) * 1024;
  const maxStringKB = opts.maxStringKB ?? 100;
  const warnings: string[] = [];

  // First pass: safe stringify with string limits
  const firstPass = safeStringify(payload, { maxStringKB });
  let bytes = Buffer.byteLength(firstPass, "utf8");

  // If within limits, return immediately
  if (bytes <= maxPayload) {
    return {
      json: firstPass,
      bytes,
      truncated: false,
      warnings
    };
  }

  // Second pass: aggressive shrinking for large arrays and objects
  warnings.push("payload exceeds size limit, applying aggressive shrink");

  try {
    // Parse the first pass result for aggressive shrinking
    const parsed = JSON.parse(firstPass);
    
    /**
     * Recursively shrink large arrays and objects
     */
    function shrinkObject(obj: any): void {
      if (!obj || typeof obj !== "object") {
        return;
      }

      // Handle large arrays (>256 elements)
      if (Array.isArray(obj) && obj.length > 256) {
        const originalLength = obj.length;
        const keepHead = obj.slice(0, 128);
        const keepTail = obj.slice(-32);
        
        // Clear and rebuild with head + tail
        obj.length = 0;
        obj.push(...keepHead);
        obj.push(`__TRIMMED__(${originalLength - 160} items removed)`);
        obj.push(...keepTail);
        
        warnings.push(`array shrunk from ${originalLength} to ${obj.length} items`);
        return;
      }

      // Recursively process object properties
      for (const key of Object.keys(obj)) {
        shrinkObject(obj[key]);
      }
    }

    // Apply aggressive shrinking
    shrinkObject(parsed);

    // Third pass: re-stringify with more aggressive string limits
    const secondPass = safeStringify(parsed, { maxStringKB: 64 });
    bytes = Buffer.byteLength(secondPass, "utf8");
    
    const truncated = bytes > maxPayload;
    
    if (truncated) {
      warnings.push(`payload still exceeds ${maxPayload}B after shrink, sending trimmed view`);
      // Final fallback: hard truncate
      const finalJson = secondPass.slice(0, maxPayload);
      return {
        json: finalJson,
        bytes: maxPayload,
        truncated: true,
        warnings
      };
    } else {
      warnings.push("payload successfully shrunk");
      return {
        json: secondPass,
        bytes,
        truncated: true,
        warnings
      };
    }

  } catch (error) {
    // If aggressive shrinking fails, return error-safe fallback
    warnings.push(`aggressive shrink failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    const fallbackJson = JSON.stringify({
      error: "payload_too_large",
      message: "Payload exceeds size limits and could not be shrunk",
      originalSize: bytes,
      maxSize: maxPayload,
      timestamp: new Date().toISOString()
    });

    return {
      json: fallbackJson,
      bytes: Buffer.byteLength(fallbackJson, "utf8"),
      truncated: true,
      warnings
    };
  }
}

/**
 * Check if a payload would be truncated by guardrail
 * @param payload - The payload to check
 * @param opts - Configuration options
 * @returns True if would be truncated
 */
export function wouldTruncate(payload: unknown, opts: GuardrailOpts = {}): boolean {
  const maxPayload = (opts.maxPayloadKB ?? 256) * 1024;
  const firstPass = safeStringify(payload, { maxStringKB: opts.maxStringKB ?? 100 });
  const bytes = Buffer.byteLength(firstPass, "utf8");
  return bytes > maxPayload;
}

/**
 * Get payload size estimate
 * @param payload - The payload to measure
 * @param opts - Configuration options
 * @returns Size estimate in bytes
 */
export function getPayloadSize(payload: unknown, opts: GuardrailOpts = {}): number {
  const firstPass = safeStringify(payload, { maxStringKB: opts.maxStringKB ?? 100 });
  return Buffer.byteLength(firstPass, "utf8");
}
