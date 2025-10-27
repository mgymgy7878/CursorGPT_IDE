/**
 * Chunked Upload for large payloads.
 * Splits large strings into manageable chunks and creates manifest files.
 * 
 * @fileoverview Handles ultra-large payloads by chunking and manifesting
 * @author Spark Trading Platform
 * @version 1.0.0
 */

import { createHash } from 'crypto';

export interface ChunkManifest {
  /** Unique identifier for this upload */
  id: string;
  /** Number of chunks */
  parts: number;
  /** Chunk size in KB */
  chunkKB: number;
  /** Creation timestamp */
  createdAt: number;
  /** Total size in bytes */
  totalBytes: number;
  /** Original payload hash (for integrity) */
  hash?: string;
}

export interface ChunkResult {
  /** Chunked data */
  chunks: string[];
  /** Manifest information */
  manifest: ChunkManifest;
  /** Whether payload was chunked */
  wasChunked: boolean;
}

/**
 * Split a string into chunks of specified size
 * @param data - The string to chunk
 * @param chunkKB - Chunk size in KB (default: 100)
 * @returns Array of string chunks
 * 
 * @example
 * ```typescript
 * const largeString = "x".repeat(500000); // 500KB
 * const chunks = chunkString(largeString, 100); // 5 chunks of 100KB each
 * console.log(chunks.length); // 5
 * ```
 */
export function chunkString(data: string, chunkKB: number = 100): string[] {
  const chunkSize = chunkKB * 1024; // Convert KB to bytes
  const chunks: string[] = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Create a manifest for chunked data
 * @param id - Unique identifier
 * @param chunks - Array of chunks
 * @param chunkKB - Chunk size in KB
 * @param hash - Optional hash for integrity
 * @returns Manifest object
 * 
 * @example
 * ```typescript
 * const chunks = chunkString(largeData, 100);
 * const manifest = makeManifest("upload-123", chunks, 100);
 * console.log(manifest.parts); // Number of chunks
 * ```
 */
export function makeManifest(
  id: string, 
  chunks: string[], 
  chunkKB: number = 100,
  hash?: string
): ChunkManifest {
  const totalBytes = chunks.reduce((sum, chunk) => sum + Buffer.byteLength(chunk, 'utf8'), 0);
  
  return {
    id,
    parts: chunks.length,
    chunkKB,
    createdAt: Date.now(),
    totalBytes,
    hash
  };
}

/**
 * Process a payload and determine if chunking is needed
 * @param payload - The payload to process
 * @param maxSizeKB - Maximum size before chunking (default: 256)
 * @param chunkSizeKB - Chunk size (default: 100)
 * @returns Chunk result with chunks and manifest
 * 
 * @example
 * ```typescript
 * const largePayload = { data: "x".repeat(500000) };
 * const result = processPayloadChunking(largePayload);
 * if (result.wasChunked) {
 *   // Send manifest to tool, chunks to storage
 *   console.log(`Payload chunked into ${result.chunks.length} parts`);
 * }
 * ```
 */
export function processPayloadChunking(
  payload: unknown,
  maxSizeKB: number = 256,
  chunkSizeKB: number = 100
): ChunkResult {
  const payloadString = JSON.stringify(payload);
  const payloadBytes = Buffer.byteLength(payloadString, 'utf8');
  const maxBytes = maxSizeKB * 1024;
  
  // If payload is within limits, no chunking needed
  if (payloadBytes <= maxBytes) {
    return {
      chunks: [payloadString],
      manifest: {
        id: `single-${Date.now()}`,
        parts: 1,
        chunkKB: chunkSizeKB,
        createdAt: Date.now(),
        totalBytes: payloadBytes
      },
      wasChunked: false
    };
  }
  
  // Chunk the payload
  const chunks = chunkString(payloadString, chunkSizeKB);
  const manifest = makeManifest(
    `chunked-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    chunks,
    chunkSizeKB,
    createHash('sha256').update(payloadString).digest('hex')
  );
  
  return {
    chunks,
    manifest,
    wasChunked: true
  };
}

/**
 * Reconstruct payload from chunks and manifest
 * @param chunks - Array of chunks
 * @param manifest - Manifest information
 * @returns Reconstructed payload
 * 
 * @example
 * ```typescript
 * const reconstructed = reconstructPayload(chunks, manifest);
 * const payload = JSON.parse(reconstructed);
 * ```
 */
export function reconstructPayload(chunks: string[], manifest: ChunkManifest): string {
  if (chunks.length !== manifest.parts) {
    throw new Error(`Chunk count mismatch: expected ${manifest.parts}, got ${chunks.length}`);
  }
  
  return chunks.join('');
}

/**
 * Validate chunk integrity
 * @param chunks - Array of chunks
 * @param manifest - Manifest information
 * @returns True if chunks are valid
 */
export function validateChunks(chunks: string[], manifest: ChunkManifest): boolean {
  if (chunks.length !== manifest.parts) {
    return false;
  }
  
  const totalBytes = chunks.reduce((sum, chunk) => sum + Buffer.byteLength(chunk, 'utf8'), 0);
  return totalBytes === manifest.totalBytes;
}
