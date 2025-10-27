/**
 * Local filesystem-based chunk storage.
 * Stores chunks in .data/chunks/<requestId>/<part>.jsonl format.
 * Includes TTL-based cleanup (24h default).
 * 
 * @fileoverview Local chunk storage with cleanup
 * @author Spark Trading Platform
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { ChunkManifest } from '../guardrails/chunk.js';

export interface ChunkStorageConfig {
  /** Storage directory */
  storageDir: string;
  /** TTL in hours */
  ttlHours: number;
  /** Cleanup interval in minutes */
  cleanupIntervalMinutes: number;
}

export interface ChunkStorageResult {
  /** Whether storage was successful */
  success: boolean;
  /** Storage path */
  path: string;
  /** Error if failed */
  error?: string;
}

const DEFAULT_CONFIG: ChunkStorageConfig = {
  storageDir: '.data/chunks',
  ttlHours: 24,
  cleanupIntervalMinutes: 60
};

/**
 * Store chunks locally with manifest
 * @param manifest - Chunk manifest
 * @param chunks - Array of chunks
 * @param config - Storage configuration
 * @returns Storage result
 * 
 * @example
 * ```typescript
 * const result = await storeChunks(manifest, chunks);
 * if (result.success) {
 *   console.log(`Chunks stored at ${result.path}`);
 * }
 * ```
 */
export async function storeChunks(
  manifest: ChunkManifest,
  chunks: string[],
  config: Partial<ChunkStorageConfig> = {}
): Promise<ChunkStorageResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    // Create storage directory
    const storagePath = join(finalConfig.storageDir, manifest.id);
    await fs.mkdir(storagePath, { recursive: true });
    
    // Store manifest
    const manifestPath = join(storagePath, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    // Store chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunkPath = join(storagePath, `part-${i}.jsonl`);
      await fs.writeFile(chunkPath, chunks[i]);
    }
    
    // Create completion marker
    const completionPath = join(storagePath, 'completed');
    await fs.writeFile(completionPath, JSON.stringify({
      completedAt: Date.now(),
      totalChunks: chunks.length,
      totalBytes: manifest.totalBytes
    }));
    
    return {
      success: true,
      path: storagePath
    };
    
  } catch (error) {
    return {
      success: false,
      path: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Retrieve chunks from storage
 * @param requestId - Request ID
 * @param config - Storage configuration
 * @returns Retrieved chunks and manifest
 */
export async function retrieveChunks(
  requestId: string,
  config: Partial<ChunkStorageConfig> = {}
): Promise<{ manifest: ChunkManifest; chunks: string[] } | null> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const storagePath = join(finalConfig.storageDir, requestId);
    
    // Read manifest
    const manifestPath = join(storagePath, 'manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf8');
    const manifest: ChunkManifest = JSON.parse(manifestData);
    
    // Read chunks
    const chunks: string[] = [];
    for (let i = 0; i < manifest.parts; i++) {
      const chunkPath = join(storagePath, `part-${i}.jsonl`);
      const chunkData = await fs.readFile(chunkPath, 'utf8');
      chunks.push(chunkData);
    }
    
    return { manifest, chunks };
    
  } catch (error) {
    return null;
  }
}

/**
 * Clean up expired chunks
 * @param config - Storage configuration
 * @returns Cleanup result
 */
export async function cleanupExpiredChunks(
  config: Partial<ChunkStorageConfig> = {}
): Promise<{ cleaned: number; errors: number }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const ttlMs = finalConfig.ttlHours * 60 * 60 * 1000;
  const now = Date.now();
  let cleaned = 0;
  let errors = 0;
  
  try {
    const entries = await fs.readdir(finalConfig.storageDir);
    
    for (const entry of entries) {
      const entryPath = join(finalConfig.storageDir, entry);
      const stat = await fs.stat(entryPath);
      
      if (stat.isDirectory()) {
        // Check if directory is expired
        if (now - stat.mtime.getTime() > ttlMs) {
          try {
            await fs.rm(entryPath, { recursive: true, force: true });
            cleaned++;
          } catch (error) {
            errors++;
          }
        }
      }
    }
    
  } catch (error) {
    // Storage directory might not exist
    if ((error as any)?.code !== 'ENOENT') {
      errors++;
    }
  }
  
  return { cleaned, errors };
}

/**
 * Get storage statistics
 * @param config - Storage configuration
 * @returns Storage statistics
 */
export async function getStorageStats(
  config: Partial<ChunkStorageConfig> = {}
): Promise<{
  totalChunks: number;
  totalSize: number;
  oldestChunk: number;
  newestChunk: number;
}> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let totalChunks = 0;
  let totalSize = 0;
  let oldestChunk = Date.now();
  let newestChunk = 0;
  
  try {
    const entries = await fs.readdir(finalConfig.storageDir);
    
    for (const entry of entries) {
      const entryPath = join(finalConfig.storageDir, entry);
      const stat = await fs.stat(entryPath);
      
      if (stat.isDirectory()) {
        const manifestPath = join(entryPath, 'manifest.json');
        try {
          const manifestData = await fs.readFile(manifestPath, 'utf8');
          const manifest: ChunkManifest = JSON.parse(manifestData);
          
          totalChunks += manifest.parts;
          totalSize += manifest.totalBytes;
          oldestChunk = Math.min(oldestChunk, manifest.createdAt);
          newestChunk = Math.max(newestChunk, manifest.createdAt);
        } catch {
          // Skip invalid manifests
        }
      }
    }
    
  } catch (error) {
    // Storage directory might not exist
  }
  
  return {
    totalChunks,
    totalSize,
    oldestChunk,
    newestChunk
  };
}

/**
 * Start cleanup job with metrics
 * @param config - Storage configuration
 * @returns Cleanup interval ID
 */
export function startCleanupJob(
  config: Partial<ChunkStorageConfig> = {}
): NodeJS.Timeout {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const intervalMs = finalConfig.cleanupIntervalMinutes * 60 * 1000;
  
  return setInterval(async () => {
    try {
      const result = await cleanupExpiredChunks(finalConfig);
      
      // Record metrics if available
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
        try {
          const { aiChunkUploadTotal } = await import('../metrics.js');
          (aiChunkUploadTotal as any).inc({ event: 'gc' }, result.cleaned);
        } catch {
          // Metrics not available, continue
        }
      }
      
      console.log(`Chunk cleanup: ${result.cleaned} cleaned, ${result.errors} errors`);
    } catch (error) {
      console.error('Chunk cleanup error:', error);
    }
  }, intervalMs);
}
