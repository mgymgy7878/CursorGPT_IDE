import { FastifyInstance } from 'fastify';
import { aiGenerate } from "../ai/providers.js";
import { aiGenerateTotal, aiLatencyMs, aiTokensTotal, aiPayloadBytes, aiPayloadTruncatedTotal } from "../metrics.js";
import { GenerateInput } from "../ai/schema.js";
import { guardrailSerialize } from '../guardrails/payload.js';
import { processPayloadChunking } from '../guardrails/chunk.js';
import { storeChunks } from '../storage/local-chunks.js';
import { withSseRetry } from '../utils/sse-retry.js';

export default async function aiRoutes(app: FastifyInstance) {
  app.post('/api/ai/strategies/generate', { preHandler: tokenGuard() }, async (req: any, reply: any) => {
    const t0 = Date.now();

    // Apply payload guardrail before processing
    const body = (req.body as any) || {};
    const maxPayloadKB = Number(process.env.AI_PAYLOAD_MAX_KB ?? 256);
    const maxStringKB = Number(process.env.AI_STRING_MAX_KB ?? 100);
    const chunkUploadEnabled = process.env.AI_CHUNK_UPLOAD_ENABLED !== 'false';
    
    const guardrailResult = guardrailSerialize(body, { 
      maxPayloadKB, 
      maxStringKB 
    });
    
    // Record payload metrics
    (aiPayloadBytes as any).observe({ stage: 'pre' }, guardrailResult.bytes);
    
    if (guardrailResult.truncated) {
      (aiPayloadTruncatedTotal as any).inc({ reason: 'size' });
      req.log.warn({ 
        bytes: guardrailResult.bytes, 
        warnings: guardrailResult.warnings 
      }, 'payload trimmed by guardrail');
    }

    // Check if chunked upload is needed
    let finalPayload = body;
    if (chunkUploadEnabled && guardrailResult.bytes > maxPayloadKB * 1024) {
      try {
        const chunkResult = processPayloadChunking(body, maxPayloadKB, 100);
        
        if (chunkResult.wasChunked) {
          // Store chunks locally
          const storeResult = await storeChunks(chunkResult.manifest, chunkResult.chunks);
          
          if (storeResult.success) {
            // Send manifest instead of full payload
            finalPayload = {
              _chunked: true,
              manifest: chunkResult.manifest,
              storagePath: storeResult.path
            };
            
            req.log.info({ 
              requestId: chunkResult.manifest.id,
              chunks: chunkResult.chunks.length,
              totalBytes: chunkResult.manifest.totalBytes 
            }, 'payload chunked and stored');
          } else {
            req.log.error({ error: storeResult.error }, 'chunk storage failed');
          }
        }
      } catch (error) {
        req.log.error({ error }, 'chunking failed, using original payload');
      }
    }

    // Accept both legacy and new field names
    let parsed: any;
    try {
      const normalized = {
        pair: body.pair || body.symbol || 'BTCUSDT',
        tf: body.tf || body.timeframe || '1h',
        style: body.style,
        risk: body.risk,
      };
      parsed = GenerateInput.parse(normalized);
    } catch (e: any) {
      (aiGenerateTotal as any).labels({ model: 'n/a' }).inc();
      return reply.code(400).send({ ok:false, error:'bad_request' });
    }

    // Scope check (optional, permissive if not present)
    const scopes: string[] = (req.user?.scopes ?? []) as any;
    if (Array.isArray(scopes) && scopes.length && !scopes.includes('ai:generate')) {
      (aiGenerateTotal as any).labels({ model: 'n/a' }).inc();
      return reply.code(403).send({ ok:false, error:'forbidden' });
    }

    const providerPref = (process.env.AI_PROVIDER || 'mock').toLowerCase();

    try {
      // Use SSE retry for AI generate calls
      const sseRetryEnabled = process.env.SSE_RETRY_ENABLED !== 'false';
      
      const aiGenerateWithRetry = async () => {
        return await aiGenerate({ 
          symbol: parsed.pair, 
          risk: (parsed.risk||'low'), 
          timeframe: parsed.tf, 
          provider: bodyProvider(req),
          payload: finalPayload  // Use processed payload (chunked or original)
        } as any);
      };
      
      const out = sseRetryEnabled 
        ? await withSseRetry(aiGenerateWithRetry)
        : await aiGenerateWithRetry();
      
      const dt = Date.now() - t0;
      (aiLatencyMs as any).observe({ model: out.provider || 'n/a' }, dt);
      (aiGenerateTotal as any).labels({ model: out.provider || 'n/a' }).inc();
      try {
        const tu: any = (out as any).tokenUsage;
        if (tu && typeof tu === 'object') {
          if (typeof tu.in === 'number') (aiTokensTotal as any).labels({ dir: 'in' }).inc(tu.in);
          if (typeof tu.out === 'number') (aiTokensTotal as any).labels({ dir: 'out' }).inc(tu.out);
        } else if (typeof tu === 'number') {
          (aiTokensTotal as any).labels({ dir: 'out' }).inc(tu);
        }
      } catch {}
      return reply.send({ ok:true, provider: out.provider, strategy: out.strategy });
    } catch (e: any) {
      // simple fallback to mock if openai fails
      if (providerPref === 'openai') {
        try {
          const out = await aiGenerate({ symbol: parsed.pair, risk: (parsed.risk||'low'), timeframe: parsed.tf, provider: 'mock' } as any);
          const dt = Date.now() - t0; (aiLatencyMs as any).observe({ model: out.provider || 'mock' }, dt);
          (aiGenerateTotal as any).labels({ model: out.provider || 'mock' }).inc();
          return reply.send({ ok:true, provider: out.provider, strategy: out.strategy, fallback:true });
        } catch {}
      }
      const sc = Number(e?.statusCode || 503);
      const status = sc === 429 ? '429' : (sc >= 500 ? '5xx' : '4xx');
      (aiGenerateTotal as any).labels({ model: providerPref || 'n/a' }).inc();
      return reply.code(sc || 503).send({ ok:false, error:'provider_failed' });
    }
  });

  // backward-compat passthrough
  app.post('/api/advisor/suggest', async (req, reply) => {
    const r = await app.inject({ method: 'POST', url: '/api/ai/strategies/generate', payload: req.body, headers: req.headers as any });
    reply.status(r.statusCode).headers(r.headers()).send(r.body);
  });
}

function tokenGuard() {
  const token = process.env.EXEC_API_TOKEN;
  if (!token) return async (_req:any,_res:any)=>{};
  return async (req:any, reply:any) => {
    const got = (req.headers['authorization']||'').toString().replace(/^Bearer\s+/i,'') || (req.headers['x-exec-token'] as any);
    if (got !== token) return reply.code(401).send({ ok:false, error:'unauthorized' });
  };
}

function bodyProvider(req: any): any {
  try {
    const p = (req.body as any)?.provider;
    if (p && typeof p === 'string') return p;
  } catch {}
  return undefined;
}

async function withSseRetry<T>(fn: () => Promise<T>): Promise<T> {
  // Simple retry wrapper for now
  try {
    return await fn();
  } catch (e) {
    // For now, just rethrow - can implement exponential backoff later
    throw e;
  }
}
