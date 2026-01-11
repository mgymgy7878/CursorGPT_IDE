/**
 * Tool Registry
 *
 * Central registry for all Copilot tools.
 * Handles tool registration, lookup, and execution.
 */

import type { ToolDefinition, ToolResult, ToolContext } from './types.js';

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Register a tool
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * List all tools, optionally filtered by category
   */
  list(category?: ToolDefinition['category']): ToolDefinition[] {
    const all = Array.from(this.tools.values());
    if (!category) return all;
    return all.filter(tool => tool.category === category);
  }

  /**
   * Check if a tool can be executed by a user
   */
  canExecute(toolName: string, ctx: ToolContext): boolean {
    const tool = this.get(toolName);
    if (!tool) return false;

    // Check role requirements
    if (tool.policy?.requiredRoles) {
      if (!tool.policy.requiredRoles.includes(ctx.userRole)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute a tool
   */
  async execute(
    toolName: string,
    params: Record<string, any>,
    ctx: ToolContext
  ): Promise<ToolResult> {
    const tool = this.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolName}" not found`,
        errorCode: 'TOOL_NOT_FOUND',
      };
    }

    // Validate params against schema
    try {
      tool.schema.parse(params);
    } catch (error: any) {
      return {
        success: false,
        error: `Invalid parameters: ${error.message}`,
        errorCode: 'INVALID_PARAMS',
      };
    }

    // Check permissions
    if (!this.canExecute(toolName, ctx)) {
      return {
        success: false,
        error: `User role "${ctx.userRole}" cannot execute tool "${toolName}"`,
        errorCode: 'PERMISSION_DENIED',
      };
    }

    // Determine dry-run mode
    const effectiveDryRun = tool.category === 'stateful'
      ? (ctx.dryRun ?? tool.defaultDryRun)
      : false;

    const effectiveCtx: ToolContext = {
      ...ctx,
      dryRun: effectiveDryRun,
    };

    // Execute handler
    try {
      const result = await tool.handler(params, effectiveCtx);

      // Set confirmRequired for stateful tools in commit mode
      if (tool.category === 'stateful' && !effectiveDryRun) {
        result.confirmRequired = true;
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Tool execution failed',
        errorCode: 'EXECUTION_ERROR',
      };
    }
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();

