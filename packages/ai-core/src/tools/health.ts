/**
 * getRuntimeHealth Tool
 *
 * Retrieves runtime health status of all system components.
 * This is the first real tool implementation (read-only, low risk).
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext, ToolResult } from './types.js';
import { toolRegistry } from './registry.js';

const HealthToolSchema = z.object({
  // No parameters needed for now
}).passthrough();

async function getRuntimeHealthHandler(
  _params: z.infer<typeof HealthToolSchema>,
  _ctx: ToolContext
): Promise<ToolResult> {
  try {
    // Fetch health data from internal API
    // In server-side context, we can call localhost directly
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';
    const healthUrl = `${baseUrl}/api/healthz`;

    const response = await fetch(healthUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Health check failed: ${response.status}`,
      };
    }

    const healthData = await response.json() as {
      status?: string;
      services?: {
        ui?: string;
        executor?: {
          status?: string;
          latencyMs?: number;
        };
      };
      latencyMs?: number;
      timestamp?: number;
      venues?: {
        btcturk?: {
          status?: string;
          stalenessSec?: number;
        };
        binance?: {
          status?: string;
          stalenessSec?: number;
        };
      };
    };

    // Map to tool output schema
    const result = {
      status: healthData.status || 'UNKNOWN',
      services: healthData.services || {},
      latency: healthData.latencyMs || null,
      timestamp: healthData.timestamp || Date.now(),
      feeds: {
        btcturk: {
          status: healthData.venues?.btcturk?.status || 'UNKNOWN',
          stalenessSeconds: healthData.venues?.btcturk?.stalenessSec || 0,
        },
        binance: {
          status: healthData.venues?.binance?.status || 'UNKNOWN',
          stalenessSeconds: healthData.venues?.binance?.stalenessSec || 0,
        },
      },
      executor: {
        status: healthData.services?.executor?.status || 'UNKNOWN',
        latency: healthData.services?.executor?.latencyMs || null,
      },
    };

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch health data',
    };
  }
}

/**
 * Register getRuntimeHealth tool
 */
export function registerHealthTool(): void {
  const tool: ToolDefinition = {
    name: 'getRuntimeHealth',
    description: 'Get runtime health status of all system components (feeds, executor, services)',
    category: 'read-only',
    defaultDryRun: false, // Read-only, no dry-run needed
    schema: HealthToolSchema,
    handler: getRuntimeHealthHandler,
    policy: {
      requiredRoles: [], // Everyone can check health
    },
  };

  toolRegistry.register(tool);
}

