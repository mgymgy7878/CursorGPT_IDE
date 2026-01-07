/**
 * Tool Router
 *
 * Routes tool calls through policy checks and audit logging.
 * This is the central orchestration layer for tool execution.
 */

import { toolRegistry } from '../tools/registry.js';
import { policyEngine } from './PolicyEngine.js';
import { auditLogger } from '../audit/AuditLogger.js';
import type { ToolContext, ToolResult, ToolCall } from '../tools/types.js';
import { createHash } from 'crypto';

export class ToolRouter {
  /**
   * Route a tool call through the full pipeline:
   * 1. Lookup tool
   * 2. Policy check
   * 3. Normalize dry-run
   * 4. Execute
   * 5. Audit log
   */
  async route(
    toolCall: ToolCall,
    ctx: ToolContext
  ): Promise<ToolResult> {
    const requestId = toolCall.requestId || this.generateRequestId();

    const effectiveCtx: ToolContext = {
      ...ctx,
      requestId,
    };

    // Lookup tool
    const tool = toolRegistry.get(toolCall.tool);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolCall.tool}" not found`,
        errorCode: 'TOOL_NOT_FOUND',
      };
    }

    // Policy check
    const policyResult = policyEngine.check(tool, effectiveCtx);
    if (!policyResult.allowed) {
      return {
        success: false,
        error: policyResult.reason || 'Policy check failed',
        errorCode: 'POLICY_DENIED',
      };
    }

    // Normalize dry-run (stateful tools default to dry-run)
    const effectiveDryRun = tool.category === 'stateful'
      ? (ctx.dryRun ?? tool.defaultDryRun)
      : false;

    const executionCtx: ToolContext = {
      ...effectiveCtx,
      dryRun: effectiveDryRun,
    };

    // Execute tool
    const result = await toolRegistry.execute(
      toolCall.tool,
      toolCall.params,
      executionCtx
    );

    // Determine confirmRequired
    if (tool.category === 'stateful' && !effectiveDryRun) {
      result.confirmRequired = true;
    }

    // Audit log (with timing)
    const startTime = Date.now();
    const elapsedMs = Date.now() - startTime; // Approximate, actual timing should be measured in handler

    const auditEntry = auditLogger.createEntry({
      requestId,
      timestamp: Date.now(),
      actor: ctx.userId,
      role: ctx.userRole,
      tool: toolCall.tool,
      params: toolCall.params,
      paramsHash: this.hashObject(toolCall.params),
      result: result.success ? result.data : { error: result.error },
      resultHash: result.success ? this.hashObject(result.data) : undefined,
      dryRun: effectiveDryRun,
      confirmRequired: result.confirmRequired || false,
      elapsedMs,
      ok: result.success,
      errorCode: result.success ? undefined : (result.error || 'UNKNOWN_ERROR'),
    });

    result.auditLog = auditEntry;

    return result;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj);
    return createHash('sha256').update(str).digest('hex').slice(0, 16);
  }
}

export const toolRouter = new ToolRouter();

