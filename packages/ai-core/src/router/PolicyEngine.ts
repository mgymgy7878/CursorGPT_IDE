/**
 * Policy Engine
 *
 * Enforces RBAC, risk gates, and other policy rules.
 */

import type { ToolContext, ToolDefinition } from '../tools/types.js';

export type UserRole = 'readonly' | 'analyst' | 'trader' | 'operator' | 'admin';

export interface PolicyRule {
  maxOpenPositions?: number;
  dailyLossLimit?: number;
  notionalLimit?: number;
  requireHealthyFeed?: boolean;
}

export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
}

export class PolicyEngine {
  private roles: Record<UserRole, string[]> = {
    readonly: ['getMarketSnapshot', 'getStrategies', 'getStrategy', 'getPortfolioSummary', 'getRuntimeHealth', 'runBacktest', 'startBacktest', 'getBacktestStatus'], // P1.0: lifecycle tools
    analyst: ['getMarketSnapshot', 'getStrategies', 'getStrategy', 'getPortfolioSummary', 'getRuntimeHealth', 'runBacktest', 'startBacktest', 'getBacktestStatus', 'runOptimize'],
    trader: ['getMarketSnapshot', 'getStrategies', 'getStrategy', 'getPortfolioSummary', 'getRuntimeHealth', 'runBacktest', 'startBacktest', 'confirmBacktest', 'getBacktestStatus', 'runOptimize', 'proposeStrategyChange', 'startStrategy', 'pauseStrategy', 'stopStrategy'],
    operator: ['getMarketSnapshot', 'getStrategies', 'getStrategy', 'getPortfolioSummary', 'getRuntimeHealth', 'runBacktest', 'startBacktest', 'confirmBacktest', 'getBacktestStatus', 'runOptimize', 'proposeStrategyChange', 'startStrategy', 'pauseStrategy', 'stopStrategy'],
    admin: ['*'], // All tools
  };

  private rules: PolicyRule = {
    maxOpenPositions: 10,
    dailyLossLimit: 1000, // USD
    requireHealthyFeed: true,
  };

  /**
   * Check if a user can execute a tool
   */
  check(tool: ToolDefinition, ctx: ToolContext): PolicyCheckResult {
    // Check role permissions
    const userAllowedTools = this.roles[ctx.userRole as UserRole];
    if (!userAllowedTools) {
      return {
        allowed: false,
        reason: `Unknown user role: ${ctx.userRole}`,
      };
    }

    if (userAllowedTools[0] !== '*' && !userAllowedTools.includes(tool.name)) {
      return {
        allowed: false,
        reason: `Role "${ctx.userRole}" cannot execute tool "${tool.name}"`,
      };
    }

    // For read-only tools, always allow (in dry-run context)
    if (tool.category === 'read-only') {
      return { allowed: true };
    }

    // For stateful tools, additional checks can be added here
    // (risk gates, feed health, etc.)

    return { allowed: true };
  }

  /**
   * Update policy rules
   */
  updateRules(rules: Partial<PolicyRule>): void {
    this.rules = { ...this.rules, ...rules };
  }

  /**
   * Get current policy rules
   */
  getRules(): PolicyRule {
    return { ...this.rules };
  }
}

export const policyEngine = new PolicyEngine();

