/**
 * Copilot Chat Endpoint (SSE Streaming)
 *
 * POST /api/copilot/chat
 *
 * Streaming endpoint for Copilot conversations with tool calling support.
 * Uses controlled JSON command mode (v0 approach).
 *
 * HARDENING (P0):
 * - SSE headers: text/event-stream, no-cache, no-transform, keep-alive
 * - Runtime: nodejs (explicit, no Edge surprises)
 * - Abort handling: client disconnect cleanup
 * - JSON extractor: fenced blocks + sentinel format only
 * - Tool call limits: max 3 per message, max 32KB payload
 * - Tool allowlist: registry-only, no fuzzy matching
 */

import { NextRequest } from 'next/server';
import { OpenAIProvider } from '@spark/ai-core';
import { toolRouter, toolRegistry } from '@spark/ai-core';
import type { ToolCall } from '@spark/ai-core';
import { exportEvidence } from '@spark/ai-core';
import {
  onSseStreamOpen,
  onSseStreamClose,
  onSseEvent,
  onSseInvalidDrop,
  onSseBytes,
  onSseStreamDuration,
} from '@/server/copilotSseMetrics';

export const runtime = 'nodejs';

interface ChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId?: string;
  userRole?: string;
  dryRun?: boolean;
}

// P0 Hardening: Tool call limits
const MAX_TOOL_CALLS_PER_MESSAGE = 3;
const MAX_PAYLOAD_SIZE_BYTES = 32 * 1024; // 32KB

/**
 * Extract tool calls from LLM response (JSON command mode)
 *
 * HARDENING: Only extract from:
 * 1. Fenced code blocks: ```json {...} ```
 * 2. Sentinel format: TOOL_CALL_START {...} TOOL_CALL_END
 *
 * This prevents prompt injection and parse accidents.
 */
function extractToolCalls(text: string): ToolCall[] {
  const calls: ToolCall[] = [];

  // Method 1: Extract from fenced JSON blocks
  const fencedBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
  let match;
  while ((match = fencedBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.tool && typeof parsed.tool === 'string') {
        calls.push({
          tool: parsed.tool,
          params: parsed.params || {},
        });
      }
    } catch {
      // Skip invalid JSON in fenced block
    }
  }

  // Method 2: Extract from sentinel format
  const sentinelRegex = /TOOL_CALL_START\s*(\{[\s\S]*?\})\s*TOOL_CALL_END/g;
  while ((match = sentinelRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.tool && typeof parsed.tool === 'string') {
        calls.push({
          tool: parsed.tool,
          params: parsed.params || {},
        });
      }
    } catch {
      // Skip invalid JSON in sentinel
    }
  }

  // Validate: tool must exist in registry (allowlist)
  const validated: ToolCall[] = [];
  for (const call of calls) {
    if (toolRegistry.get(call.tool)) {
      validated.push(call);
    }
    // Silently reject unknown tools (no fuzzy matching)
  }

  // Apply limits (return all, caller will slice and emit event)
  return validated;
}

/**
 * Validate payload size
 */
function validatePayloadSize(text: string): boolean {
  const sizeBytes = new TextEncoder().encode(text).length;
  return sizeBytes <= MAX_PAYLOAD_SIZE_BYTES;
}

// P1.1: Backtest job polling limits
const MAX_POLL_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const MAX_POLL_EVENTS = 400;
const POLL_INTERVAL_MS = 1500; // Base interval 1.5s
const POLL_JITTER_MS = 1000; // Jitter ±1s (1.5-2.5s range)

/**
 * Poll backtest job status and emit progress/done/failed events (P1.1)
 */
async function pollBacktestJob(
  jobId: string,
  write: (data: string) => void,
  requestId: string,
  abortSignal: AbortSignal,
  onProgressUpdate: (progressEvents: number, finalStatus?: string) => void
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';
  const startTime = Date.now();
  let lastProgress: number | undefined = undefined;
  let lastPhase: string | undefined = undefined;
  let lastProgressEventTime = 0;
  let pollCount = 0;
  let progressEvents = 0;
  let progressSeq = 0; // P1.1 Hardening: Monotonically increasing sequence number
  // P1.1 Hardening: Smart heartbeat - more frequent when running, less when queued
  const HEARTBEAT_INTERVAL_RUNNING_MS = 5000; // 5s when running
  const HEARTBEAT_INTERVAL_QUEUED_MS = 15000; // 15s when queued

  const getPollDelay = (): number => {
    return POLL_INTERVAL_MS + Math.random() * POLL_JITTER_MS;
  };

  while (!abortSignal.aborted) {
    // Check limits
    if (Date.now() - startTime > MAX_POLL_DURATION_MS) {
      write(JSON.stringify({
        event: 'job_failed',
        requestId,
        ts: Date.now(),
        data: {
          jobId,
          tool: 'backtest',
          error: 'Polling timeout (10 minutes)',
          errorCode: 'EXECUTION_ERROR',
        },
        ok: false,
        errorCode: 'EXECUTION_ERROR',
      }), 'job_failed');
      onProgressUpdate(progressEvents, 'timeout');
      break;
    }

    if (pollCount >= MAX_POLL_EVENTS) {
      write(JSON.stringify({
        event: 'job_failed',
        requestId,
        ts: Date.now(),
        data: {
          jobId,
          tool: 'backtest',
          error: 'Polling event limit exceeded',
          errorCode: 'EXECUTION_ERROR',
        },
        ok: false,
        errorCode: 'EXECUTION_ERROR',
      }), 'job_failed');
      onProgressUpdate(progressEvents, 'timeout');
      break;
    }

    try {
      // Fetch job status
      const statusUrl = `${baseUrl}/api/backtest/status?jobId=${encodeURIComponent(jobId)}`;
      const response = await fetch(statusUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        // If job not found or API error, stop polling
        if (response.status === 404) {
          write(JSON.stringify({
            event: 'job_failed',
            requestId,
            ts: Date.now(),
            data: {
              jobId,
              tool: 'backtest',
              error: 'Job not found',
              errorCode: 'NOT_FOUND',
            },
            ok: false,
            errorCode: 'NOT_FOUND',
          }), 'job_failed');
          onProgressUpdate(progressEvents, 'failed');
          break;
        }
        // Continue polling on other errors (transient)
        await new Promise(resolve => setTimeout(resolve, getPollDelay()));
        pollCount++;
        continue;
      }

      const status = await response.json() as {
        status?: 'queued' | 'running' | 'done' | 'failed' | 'success' | 'error';
        progress?: number;
        progressPct?: number;
        pct?: number;
        phase?: string;
        step?: string;
        etaSec?: number;
        error?: string;
        errorCode?: string;
        result?: any;
      };

      // Normalize status
      const normalizedStatus = status.status === 'success' || status.status === 'done'
        ? 'done'
        : status.status === 'error' || status.status === 'failed'
        ? 'failed'
        : status.status === 'running'
        ? 'running'
        : 'queued';

      const currentProgress = status.progress ?? status.progressPct ?? status.pct;
      const currentPhase = status.phase || status.step;

      // Emit job_progress if progress/phase changed or heartbeat needed
      if (normalizedStatus === 'running' || normalizedStatus === 'queued') {
        const now = Date.now();
        const progressChanged = currentProgress !== lastProgress || currentPhase !== lastPhase;
        // P1.1 Hardening: Smart heartbeat - more frequent when running, less when queued
        const heartbeatInterval = normalizedStatus === 'running'
          ? HEARTBEAT_INTERVAL_RUNNING_MS
          : HEARTBEAT_INTERVAL_QUEUED_MS;
        const heartbeatNeeded = now - lastProgressEventTime >= heartbeatInterval;

        if (progressChanged || heartbeatNeeded) {
          progressSeq++;
          write(JSON.stringify({
            event: 'job_progress',
            requestId,
            ts: now,
            data: {
              jobId,
              tool: 'backtest',
              status: normalizedStatus,
              progress: currentProgress,
              phase: currentPhase || undefined,
              etaSec: status.etaSec,
              seq: progressSeq, // P1.1 Hardening: Monotonic sequence for UI ordering
            },
            ok: true,
          }), 'job_progress');
          progressEvents++;
          lastProgress = currentProgress;
          lastPhase = currentPhase;
          lastProgressEventTime = now;
          onProgressUpdate(progressEvents);
        }

        // Continue polling
        await new Promise(resolve => setTimeout(resolve, getPollDelay()));
        pollCount++;
      } else if (normalizedStatus === 'done') {
        // Job completed successfully
        write(JSON.stringify({
          event: 'job_done',
          requestId,
          ts: Date.now(),
          data: {
            jobId,
            tool: 'backtest',
            status: 'done',
            hasResult: !!status.result,
          },
          ok: true,
        }), 'job_done');
        progressEvents++;
        onProgressUpdate(progressEvents, 'done');
        break;
      } else if (normalizedStatus === 'failed') {
        // Job failed
        write(JSON.stringify({
          event: 'job_failed',
          requestId,
          ts: Date.now(),
          data: {
            jobId,
            tool: 'backtest',
            status: 'failed',
            error: status.error || 'Backtest job failed',
            errorCode: status.errorCode || 'EXECUTION_ERROR',
          },
          ok: false,
          errorCode: status.errorCode || 'EXECUTION_ERROR',
        }), 'job_failed');
        progressEvents++;
        onProgressUpdate(progressEvents, 'failed');
        break;
      } else {
        // Unknown status, continue polling
        await new Promise(resolve => setTimeout(resolve, getPollDelay()));
        pollCount++;
      }
    } catch (error: any) {
      // On abort, stop polling silently
      if (abortSignal.aborted) {
        write(JSON.stringify({
          event: 'job_failed',
          requestId,
          ts: Date.now(),
          data: {
            jobId,
            tool: 'backtest',
            error: 'Polling aborted (client disconnected)',
            errorCode: 'CLIENT_ABORT',
          },
          ok: false,
          errorCode: 'CLIENT_ABORT',
        }), 'job_failed');
        onProgressUpdate(progressEvents, 'aborted');
        break;
      }

      // Transient error, continue polling
      await new Promise(resolve => setTimeout(resolve, getPollDelay()));
      pollCount++;
    }
  }
}

export async function POST(req: NextRequest) {
  // Gate C/D: Mock stream mode (dev-only, deterministic SSE for evidence)
  // IMPROVED: Support both env var AND request flag for easier testing
  const isDev = process.env.NODE_ENV !== 'production';
  const envMockFlag = process.env.SPARK_COPILOT_MOCK_STREAM === '1';

  // Request-level mock flag (query param OR header)
  const url = new URL(req.url);
  const queryMockFlag = url.searchParams.get('mock') === '1';
  const headerMockFlag = req.headers.get('x-spark-mock') === '1';
  const reqMockFlag = queryMockFlag || headerMockFlag;

  // Mock enabled if: dev environment AND (env flag OR request flag)
  // Security: request flag is IGNORED in production
  const mockStreamMode = isDev && (envMockFlag || reqMockFlag);

  // Security: Warn if mock mode is active (prevents accidental production use)
  if (mockStreamMode) {
    const source = envMockFlag ? 'SPARK_COPILOT_MOCK_STREAM=1' : reqMockFlag ? 'request flag (mock=1 or x-spark-mock:1)' : 'unknown';
    console.warn(`[MOCK SSE] Mock stream mode enabled - source: ${source}`);
  }

  // HARDENING: Check env var availability (server-side) - skip if mock mode
  // Semantik: 401 Unauthorized (not 500) - API key missing is auth failure
  if (!mockStreamMode && !process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: ChatRequest = await req.json();
    const { message, history = [], userId = 'anonymous', userRole = 'readonly', dryRun = true } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // HARDENING: Validate payload size
    if (!validatePayloadSize(message)) {
      return new Response(JSON.stringify({ error: 'Message payload too large' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build system prompt with tool definitions
    const availableTools = toolRegistry.list();
    const toolList = availableTools.map((tool, idx) =>
      `${idx + 1}. ${tool.name} - ${tool.description}\n   Usage: {"tool": "${tool.name}", "params": {}}`
    ).join('\n');

    const systemPrompt = `You are Spark Copilot, an AI assistant for the Spark Trading Platform.

Available tools:
${toolList}

When the user asks about system health, market data, or needs information, use the appropriate tool.
IMPORTANT: Format tool calls ONLY in one of these ways:
1. Fenced JSON block: \`\`\`json\n{"tool": "toolName", "params": {}}\n\`\`\`
2. Sentinel format: TOOL_CALL_START\n{"tool": "toolName", "params": {}}\nTOOL_CALL_END

Examples:
- "Health durumunu getir" → use getRuntimeHealth
- "BTCUSDT 1h snapshot getir" → use getMarketSnapshot with symbol="BTCUSDT", timeframe="1h"
- "Aktif stratejileri listele" → use getStrategies with status="active"
- "Şu stratejinin detayını getir: <id>" → use getStrategy with id="<id>"
- "Şu stratejiyi backtest et (dry-run): <id>, 2024-01-01'den 2024-02-01'e" → use runBacktest with strategyId="<id>", from="2024-01-01", to="2024-02-01"
- "Şu stratejiyi backtest için hazırla: <id>, 2024-01-01'den 2024-02-01'e" → use startBacktest (requires confirmation)
- "Backtest job durumunu kontrol et: <jobId>" → use getBacktestStatus with jobId="<jobId>"
- "Backtest sonucunu getir: <jobId>" → use getBacktestResult with jobId="<jobId>"

After tool execution, explain the results to the user.

Important:
- Use tools when appropriate
- Explain tool results in natural language
- Be concise and helpful`;

    // Build messages
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: message },
    ];

    // HARDENING: AbortController for cleanup on client disconnect
    const abortController = new AbortController();
    req.signal.addEventListener('abort', () => {
      abortController.abort();
    });

    // Gate D: Generate requestId for metrics correlation
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const write = (data: string, eventType?: string) => {
          if (abortController.signal.aborted) return;
          try {
            // Gate D: Validate JSON format (if eventType provided, data should be valid JSON)
            if (eventType) {
              try {
                JSON.parse(data); // Validate JSON structure
              } catch (parseErr) {
                // Gate D: Invalid JSON format - track as invalid drop
                onSseInvalidDrop(eventType, 'json_parse');
                return; // Don't send invalid data
              }
            }
            const sseData = `data: ${data}\n\n`;
            const bytes = encoder.encode(sseData).length;
            controller.enqueue(encoder.encode(sseData));
            // Gate D: Track bytes sent
            onSseBytes(bytes);
          } catch {
            // Client disconnected or encoding error, ignore
          }
        };

        try {
          // Gate D: Track stream open
          onSseStreamOpen();

          let fullResponse = '';
          const startTime = Date.now();

          // Track events for evidence (defined before use)
          let sseEventCount = 0; // Track SSE events for evidence
          const eventCounts: Record<string, number> = {
            tool_call: 0,
            tool_result: 0,
            tool_limit_exceeded: 0,
            error: 0,
            token: 0,
            done: 0,
          };

          // Gate C/D: Mock stream mode (deterministic SSE for evidence)
          if (mockStreamMode) {
            // Configurable mock stream parameters (env with defaults)
            const mockTokenCount = parseInt(process.env.SPARK_COPILOT_MOCK_TOKENS || '25', 10);
            const mockDelayMs = parseInt(process.env.SPARK_COPILOT_MOCK_DELAY_MS || '50', 10);

            // Deterministic mock tokens (fixed payload for consistent metrics)
            const mockTokens = [
              'Merhaba, ',
              'sistem ',
              'durumu ',
              'şu ',
              'an ',
              'normal ',
              'görünüyor. ',
              'Aktif ',
              'stratejiler: ',
              '12. ',
              'Portföy ',
              'değeri: ',
              '$124,592. ',
              'Risk ',
              'durumu: ',
              'Orta. ',
              'Günlük ',
              'PnL: ',
              '+$1,240.50. ',
              'Detaylı ',
              'analiz ',
              'için ',
              'hangi ',
              'bilgiyi ',
              'istiyorsunuz?'
            ].slice(0, mockTokenCount);

            // Send mock tokens
            for (let i = 0; i < mockTokens.length; i++) {
              if (abortController.signal.aborted) {
                // Gate D: Track abort (no error event, Gate C compatibility)
                const durationSeconds = (Date.now() - startTime) / 1000;
                onSseStreamDuration(durationSeconds);
                onSseStreamClose('abort');
                controller.close();
                return;
              }

              const token = mockTokens[i];
              fullResponse += token;

              const eventData = {
                event: 'token',
                requestId,
                ts: Date.now(),
                data: { content: token },
                ok: true,
              };

              try {
                const eventJson = JSON.stringify(eventData);
                write(eventJson, 'token');
                onSseEvent('token');
                eventCounts.token++;
                sseEventCount++;
              } catch (err) {
                onSseInvalidDrop('token', 'json_serialize');
              }

              // Configurable delay between tokens for realistic streaming
              await new Promise(resolve => setTimeout(resolve, mockDelayMs));
            }

            // Send message_done event
            if (!abortController.signal.aborted) {
              const doneEvent = {
                event: 'message_done',
                requestId,
                ts: Date.now(),
                data: {},
                ok: true,
              };
              try {
                const doneJson = JSON.stringify(doneEvent);
                write(doneJson, 'message_done');
                onSseEvent('message_done');
                eventCounts.done++;
                sseEventCount++;
              } catch (err) {
                onSseInvalidDrop('message_done', 'json_serialize');
              }
            }

            // Send complete event
            const totalElapsedMs = Date.now() - startTime;
            const completeEvent = {
              event: 'complete',
              requestId,
              ts: Date.now(),
              data: { elapsedMs: totalElapsedMs },
              ok: true,
            };
            write(JSON.stringify(completeEvent), 'complete');
            onSseEvent('complete');

            // Gate D: Track stream close (normal completion)
            const durationSeconds = totalElapsedMs / 1000;
            onSseStreamDuration(durationSeconds);
            onSseStreamClose('done');

            controller.close();
            return;
          }

          // Real LLM stream (original implementation)
          // Initialize LLM provider
          const provider = new OpenAIProvider();

          // Stream LLM response
          for await (const chunk of provider.streamChat(messages)) {
            if (abortController.signal.aborted) break;

            if (chunk.type === 'token' && chunk.content) {
              fullResponse += chunk.content;
              const eventData = {
                event: 'token',
                requestId,
                ts: Date.now(),
                data: { content: chunk.content },
                ok: true,
              };
              try {
                const eventJson = JSON.stringify(eventData);
                write(eventJson, 'token');
                // Gate D: Track event
                onSseEvent('token');
                eventCounts.token++;
                sseEventCount++;
              } catch (err) {
                // Gate D: Invalid event format (should not happen, but track it)
                onSseInvalidDrop('token', 'json_serialize');
              }
            } else if (chunk.type === 'done') {
              const eventData = {
                event: 'done',
                requestId,
                ts: Date.now(),
                data: {},
                ok: true,
              };
              try {
                const eventJson = JSON.stringify(eventData);
                write(eventJson, 'done');
                // Gate D: Track event
                onSseEvent('done');
                eventCounts.done++;
                sseEventCount++;
              } catch (err) {
                // Gate D: Invalid event format
                onSseInvalidDrop('done', 'json_serialize');
              }
            }
          }

          // HARDENING: Extract tool calls (fenced blocks + sentinel only)
          const allExtractedCalls = extractToolCalls(fullResponse);
          const toolCalls = allExtractedCalls.slice(0, MAX_TOOL_CALLS_PER_MESSAGE);
          let toolCallTotal = 0;
          let toolCallExecuted = 0;
          let toolLimitExceeded = false;
          const errorCodes: string[] = [];

          // HARDENING: Emit limit exceeded event if truncated
          if (allExtractedCalls.length > MAX_TOOL_CALLS_PER_MESSAGE) {
            toolLimitExceeded = true;
            const limitExceededEvent = {
              event: 'tool_limit_exceeded',
              requestId,
              ts: Date.now(),
              data: {
                total: allExtractedCalls.length,
                max: MAX_TOOL_CALLS_PER_MESSAGE,
                message: `Tool call limit exceeded: ${allExtractedCalls.length} > ${MAX_TOOL_CALLS_PER_MESSAGE}. Only first ${MAX_TOOL_CALLS_PER_MESSAGE} will be executed.`,
              },
              ok: false,
              errorCode: 'TOOL_LIMIT_EXCEEDED',
            };
            write(JSON.stringify(limitExceededEvent), 'tool_limit_exceeded');
            // Gate D: Track event
            onSseEvent('tool_limit_exceeded');
            eventCounts.tool_limit_exceeded++;
            sseEventCount++;
            errorCodes.push('TOOL_LIMIT_EXCEEDED');
          }

          toolCallTotal = allExtractedCalls.length;

          // P1.0/P1.1: Backtest lifecycle tracking (shared across tool calls)
          let backtestJobLifecycle: {
            startedAt?: number;
            completedAt?: number;
            finalStatus?: string;
            progressEvents?: number;
          } | undefined;

          if (toolCalls.length > 0) {
            // Execute each tool call
            for (const toolCall of toolCalls) {
              if (abortController.signal.aborted) break;

              const toolRequestId = `${requestId}_tool_${toolCall.tool}`;
              const toolStartTime = Date.now();

              const toolCallEvent = {
                event: 'tool_call',
                requestId: toolRequestId,
                ts: Date.now(),
                data: {
                  tool: toolCall.tool,
                  params: toolCall.params,
                },
                ok: true,
              };
              write(JSON.stringify(toolCallEvent), 'tool_call');
              // Gate D: Track event
              onSseEvent('tool_call');
              eventCounts.tool_call++;
              sseEventCount++;

              // Route tool execution
              const result = await toolRouter.route(
                { ...toolCall, requestId },
                {
                  userId,
                  userRole,
                  requestId,
                  dryRun,
                }
              );

              const elapsedMs = Date.now() - toolStartTime;
              toolCallExecuted++;

              if (result.errorCode) {
                errorCodes.push(result.errorCode);
              }

              const toolResultEvent = {
                event: 'tool_result',
                requestId: toolRequestId,
                ts: Date.now(),
                data: {
                  tool: toolCall.tool,
                  success: result.success,
                  data: result.data,
                  error: result.error,
                  confirmRequired: result.confirmRequired || false,
                  elapsedMs,
                  auditLog: result.auditLog,
                },
                ok: result.success,
                errorCode: result.errorCode,
              };
              write(JSON.stringify(toolResultEvent), 'tool_result');
              // Gate D: Track event
              onSseEvent('tool_result');
              eventCounts.tool_result++;
              sseEventCount++;

              // P1.0/P1.1: Emit job_started event and start polling if backtest job was started
              if (toolCall.tool === 'confirmBacktest' && result.success && result.data) {
                const confirmData = result.data as { jobId?: string; started?: boolean };
                if (confirmData.started && confirmData.jobId) {
                  const jobId = confirmData.jobId;
                  write(JSON.stringify({
                    event: 'job_started',
                    requestId,
                    ts: Date.now(),
                    data: {
                      jobId,
                      tool: 'backtest',
                    },
                    ok: true,
                  }), 'job_started');
                  eventCounts.tool_result++; // Count as tool_result for evidence
                  sseEventCount++;

                  // P1.1: Start polling loop for job progress
                  pollBacktestJob(
                    jobId,
                    write,
                    requestId,
                    abortController.signal,
                    (progressEvents: number, finalStatus?: string) => {
                      // Update evidence tracking
                      if (!backtestJobLifecycle) {
                        backtestJobLifecycle = {
                          startedAt: Date.now(),
                          progressEvents: 0,
                          finalStatus: finalStatus || 'running',
                        };
                      }
                      backtestJobLifecycle.progressEvents = progressEvents;
                      if (finalStatus) {
                        backtestJobLifecycle.finalStatus = finalStatus;
                        backtestJobLifecycle.completedAt = Date.now();
                      }
                    }
                  ).catch(() => {
                    // Polling errors are handled internally, just catch to prevent unhandled rejection
                  });
                }
              }

              // Export evidence (async, don't block)
              if (result.auditLog) {
                // P0.6: Calculate payload size for marketSnapshot (32KB limit monitoring)
                let marketSnapshotBytes: number | undefined;
                if (toolCall.tool === 'getMarketSnapshot' && result.data) {
                  marketSnapshotBytes = new TextEncoder().encode(JSON.stringify(result.data)).length;
                }

                // P0.7: Strategy tool tracking
                let strategyCountReturned: number | undefined;
                let strategyIdRequested: string | undefined;
                let codePreviewBytes: number | undefined;

                if (toolCall.tool === 'getStrategies' && result.data) {
                  strategyCountReturned = (result.data as { count?: number }).count ??
                                         ((result.data as { strategies?: any[] }).strategies?.length ?? 0);
                } else if (toolCall.tool === 'getStrategy') {
                  strategyIdRequested = toolCall.params.id as string;
                  if (result.data && (result.data as { codePreview?: string }).codePreview) {
                    codePreviewBytes = new TextEncoder().encode((result.data as { codePreview: string }).codePreview).length;
                  }
                }

                // P0.8: Backtest tool tracking
                let backtestDryRun: boolean | undefined;
                let backtestJobId: string | undefined;
                let backtestEstimatedBars: number | undefined;
                let backtestRangeDays: number | undefined;
                let confirmationRequiredCount = 0;
                let confirmed = false;
                // P1.1: Backtest result tracking
                let backtestResultPreviewBytes: number | undefined;
                let backtestResultHash: string | undefined;
                let backtestResultTruncated: boolean | undefined;

                if (toolCall.tool === 'runBacktest' && result.data) {
                  const backtestData = result.data as {
                    dryRun?: boolean;
                    jobId?: string;
                    estimatedBars?: number;
                    rangeDays?: number;
                  };
                  backtestDryRun = backtestData.dryRun ?? true;
                  backtestJobId = backtestData.jobId;
                  backtestEstimatedBars = backtestData.estimatedBars;
                  backtestRangeDays = backtestData.rangeDays;
                } else if (toolCall.tool === 'startBacktest' && result.data) {
                  if (result.confirmRequired) {
                    confirmationRequiredCount++;
                  }
                  backtestJobId = (result.data as { confirmationToken?: string }).confirmationToken;
                } else if (toolCall.tool === 'confirmBacktest' && result.data) {
                  confirmed = true;
                  const confirmData = result.data as {
                    jobId?: string;
                    started?: boolean;
                    status?: string;
                  };
                  backtestJobId = confirmData.jobId;
                  if (confirmData.started) {
                    backtestJobLifecycle = {
                      startedAt: Date.now(),
                      finalStatus: confirmData.status || 'queued',
                      progressEvents: 0,
                    };
                  }
                } else if (toolCall.tool === 'getBacktestStatus' && result.data) {
                  const statusData = result.data as {
                    jobId?: string;
                    status?: string;
                    startedAt?: number;
                    finishedAt?: number;
                  };
                  backtestJobId = statusData.jobId;
                  if (statusData.status === 'done' || statusData.status === 'failed') {
                    backtestJobLifecycle = {
                      startedAt: statusData.startedAt,
                      completedAt: statusData.finishedAt,
                      finalStatus: statusData.status,
                      progressEvents: eventCounts.tool_result || 0,
                    };
                  }
                } else if (toolCall.tool === 'getBacktestResult' && result.data) {
                // P1.1: Track backtest result metadata
                const resultData = result.data as {
                  resultHash?: string;
                  resultPreviewBytes?: number;
                  truncated?: boolean;
                  truncationReason?: 'trades' | 'equity' | 'metrics';
                };
                backtestResultHash = resultData.resultHash;
                backtestResultPreviewBytes = resultData.resultPreviewBytes;
                backtestResultTruncated = resultData.truncated;
                backtestResultTruncationReason = resultData.truncationReason;
                }

                exportEvidence(result.auditLog, {
                  sseEventCount,
                  toolParams: toolCall.params,
                  toolResult: result.data,
                  eventCounts,
                  toolCallTotal,
                  toolCallExecuted,
                  toolLimitExceeded,
                  errorCodes,
                  marketSnapshotBytes,
                  strategyCountReturned,
                  strategyIdRequested,
                  codePreviewBytes,
                  backtestDryRun,
                  backtestJobId,
                  backtestEstimatedBars,
                  backtestRangeDays,
                  backtestJobLifecycle,
                  confirmationRequiredCount,
                  confirmed,
                  // P1.1: Backtest result tracking
                  backtestResultPreviewBytes,
                  backtestResultHash,
                  backtestResultTruncated,
                  backtestResultTruncationReason,
                }).catch(err => {
                  console.error('Failed to export evidence:', err);
                });
              }

              // If tool was executed, get LLM to explain results
              if (result.success && result.data) {
                const toolResultText = JSON.stringify(result.data, null, 2);
                const followUpMessage = `Tool "${toolCall.tool}" executed successfully. Result:\n${toolResultText}\n\nExplain this result to the user in natural language.`;

                const followUpMessages = [
                  ...messages,
                  { role: 'assistant' as const, content: fullResponse },
                  { role: 'user' as const, content: followUpMessage },
                ];

                // Stream explanation
                for await (const chunk of provider.streamChat(followUpMessages)) {
                  if (abortController.signal.aborted) break;

                  if (chunk.type === 'token' && chunk.content) {
                    const followUpTokenEvent = {
                      event: 'token',
                      requestId,
                      ts: Date.now(),
                      data: { content: chunk.content },
                      ok: true,
                    };
                    write(JSON.stringify(followUpTokenEvent), 'token');
                    // Gate D: Track event
                    onSseEvent('token');
                    eventCounts.token++;
                    sseEventCount++;
                  } else if (chunk.type === 'done') {
                    const followUpDoneEvent = {
                      event: 'done',
                      requestId,
                      ts: Date.now(),
                      data: {},
                      ok: true,
                    };
                    write(JSON.stringify(followUpDoneEvent), 'done');
                    // Gate D: Track event
                    onSseEvent('done');
                    eventCounts.done++;
                    sseEventCount++;
                  }
                }
              }
            }
          }

          const totalElapsedMs = Date.now() - startTime;
          const completeEvent = {
            event: 'complete',
            requestId,
            ts: Date.now(),
            data: { elapsedMs: totalElapsedMs },
            ok: true,
          };
          write(JSON.stringify(completeEvent), 'complete');
          // Gate D: Track event
          onSseEvent('complete');

          // Gate D: Track stream close (normal completion)
          const durationSeconds = totalElapsedMs / 1000;
          onSseStreamDuration(durationSeconds);
          onSseStreamClose('done');

          controller.close();
        } catch (error: any) {
          const durationSeconds = (Date.now() - startTime) / 1000;

          if (abortController.signal.aborted) {
            // Client disconnected - emit abort event for audit trail
            // Gate C: AbortError → error event yok (Gate B ile uyum)
            // Gate D: Track abort (no error event emitted)
            onSseStreamDuration(durationSeconds);
            onSseStreamClose('abort');
            controller.close();
            return;
          }

          const errorEvent = {
            event: 'error',
            requestId,
            ts: Date.now(),
            data: { error: error.message || 'Unknown error' },
            ok: false,
            errorCode: 'INTERNAL_ERROR',
          };
          write(JSON.stringify(errorEvent), 'error');
          // Gate D: Track event and close
          onSseEvent('error');
          onSseStreamDuration(durationSeconds);
          onSseStreamClose('error');
          eventCounts.error++;
          errorCodes.push('INTERNAL_ERROR');
          controller.close();
        }
      },
    });

    // HARDENING: SSE headers (no buffering, no transform)
    // Gate B Enhancement: "Tam takım" SSE headers
    // Gate D: Add requestId header for log correlation
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-transform',
        'Content-Encoding': 'identity', // Prevent proxy gzip compression
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'X-Spark-Request-Id': requestId, // Gate D: Log correlation
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

