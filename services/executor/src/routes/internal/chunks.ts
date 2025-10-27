/**
 * Internal chunk management routes.
 * Handles chunk upload, completion, and manifest retrieval.
 * Requires internal system token for access.
 * 
 * @fileoverview Internal chunk API endpoints
 * @author Spark Trading Platform
 * @version 1.0.0
 */

import { FastifyInstance } from 'fastify';
import { storeChunks, retrieveChunks, getStorageStats } from '../../storage/local-chunks.js';
import { ChunkManifest } from '../../guardrails/chunk.js';

/**
 * Internal system token guard with RBAC
 */
function internalTokenGuard() {
  const token = process.env.INTERNAL_SYSTEM_TOKEN;
  const rbacEnabled = process.env.RBAC_ENABLED === 'true';
  
  if (!token) {
    return async (_req: any, reply: any) => {
      return reply.code(401).send({ 
        ok: false, 
        error: 'internal_token_not_configured',
        message: 'INTERNAL_SYSTEM_TOKEN not set' 
      });
    };
  }
  
  return async (req: any, reply: any) => {
    // Check RBAC if enabled
    if (rbacEnabled) {
      const role = req.headers['x-role'] || req.headers['role'];
      if (role !== 'system') {
        return reply.code(403).send({ 
          ok: false, 
          error: 'insufficient_role',
          message: 'role=system required for internal endpoints' 
        });
      }
    }
    
    // Check authorization header
    const authHeader = req.headers['authorization'] || '';
    const providedToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (providedToken !== token) {
      return reply.code(401).send({ 
        ok: false, 
        error: 'unauthorized',
        message: 'Invalid internal system token' 
      });
    }
  };
}

export default async function chunkRoutes(app: FastifyInstance) {
  // Upload chunks
  app.post('/internal/chunks/upload', { 
    preHandler: internalTokenGuard() 
  }, async (req: any, reply: any) => {
    try {
      const { manifest, chunks } = req.body as { manifest: ChunkManifest; chunks: string[] };
      
      if (!manifest || !chunks || !Array.isArray(chunks)) {
        return reply.code(400).send({ 
          ok: false, 
          error: 'invalid_request',
          message: 'manifest and chunks array required' 
        });
      }
      
      const result = await storeChunks(manifest, chunks);
      
      if (result.success) {
        return reply.send({ 
          ok: true, 
          path: result.path,
          chunks: chunks.length 
        });
      } else {
        return reply.code(500).send({ 
          ok: false, 
          error: 'storage_failed',
          message: result.error 
        });
      }
      
    } catch (error) {
      app.log.error({ error }, 'chunk upload failed');
      return reply.code(500).send({ 
        ok: false, 
        error: 'internal_error' 
      });
    }
  });

  // Mark chunks as complete
  app.post('/internal/chunks/complete', { 
    preHandler: internalTokenGuard() 
  }, async (req: any, reply: any) => {
    try {
      const { requestId } = req.body as { requestId: string };
      
      if (!requestId) {
        return reply.code(400).send({ 
          ok: false, 
          error: 'invalid_request',
          message: 'requestId required' 
        });
      }
      
      // Mark completion (already done in storeChunks, but for explicit completion)
      return reply.send({ 
        ok: true, 
        requestId,
        completed: true 
      });
      
    } catch (error) {
      app.log.error({ error }, 'chunk completion failed');
      return reply.code(500).send({ 
        ok: false, 
        error: 'internal_error' 
      });
    }
  });

  // Get chunk manifest
  app.get('/internal/chunks/:id/manifest', { 
    preHandler: internalTokenGuard() 
  }, async (req: any, reply: any) => {
    try {
      const { id } = req.params as { id: string };
      
      const result = await retrieveChunks(id);
      
      if (result) {
        return reply.send({ 
          ok: true, 
          manifest: result.manifest 
        });
      } else {
        return reply.code(404).send({ 
          ok: false, 
          error: 'not_found',
          message: 'chunks not found' 
        });
      }
      
    } catch (error) {
      app.log.error({ error }, 'chunk manifest retrieval failed');
      return reply.code(500).send({ 
        ok: false, 
        error: 'internal_error' 
      });
    }
  });

  // Get storage statistics
  app.get('/internal/chunks/stats', { 
    preHandler: internalTokenGuard() 
  }, async (req: any, reply: any) => {
    try {
      const stats = await getStorageStats();
      
      return reply.send({ 
        ok: true, 
        stats 
      });
      
    } catch (error) {
      app.log.error({ error }, 'chunk stats retrieval failed');
      return reply.code(500).send({ 
        ok: false, 
        error: 'internal_error' 
      });
    }
  });

  // Retrieve full chunks (for reconstruction)
  app.get('/internal/chunks/:id/retrieve', { 
    preHandler: internalTokenGuard() 
  }, async (req: any, reply: any) => {
    try {
      const { id } = req.params as { id: string };
      
      const result = await retrieveChunks(id);
      
      if (result) {
        return reply.send({ 
          ok: true, 
          manifest: result.manifest,
          chunks: result.chunks 
        });
      } else {
        return reply.code(404).send({ 
          ok: false, 
          error: 'not_found',
          message: 'chunks not found' 
        });
      }
      
    } catch (error) {
      app.log.error({ error }, 'chunk retrieval failed');
      return reply.code(500).send({ 
        ok: false, 
        error: 'internal_error' 
      });
    }
  });
}
