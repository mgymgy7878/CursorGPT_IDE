/**
 * @spark/ai-core
 *
 * Core AI infrastructure for Spark Copilot:
 * - LLM Provider abstraction
 * - Tool Registry
 * - Tool Router
 * - Policy Engine
 * - Audit Logger
 */

// Providers
export * from './providers/LLMProvider.js';
export * from './providers/OpenAIProvider.js';

// Tools
export * from './tools/types.js';
export * from './tools/registry.js';
export * from './tools/health.js';

// Router
export * from './router/ToolRouter.js';
export * from './router/PolicyEngine.js';

// Audit
export * from './audit/AuditLogger.js';
export * from './audit/EvidenceExporter.js';

// Initialize default tools
import { registerHealthTool } from './tools/health.js';
import { registerMarketSnapshotTool } from './tools/marketSnapshot.js';
import { registerStrategiesTools } from './tools/strategies.js';
import { registerBacktestTool } from './tools/backtest.js';
import { registerBacktestLifecycleTools } from './tools/backtestLifecycle.js';
import { registerBacktestResultTool } from './tools/backtestResult.js';

registerHealthTool();
registerMarketSnapshotTool();
registerStrategiesTools();
registerBacktestTool();
registerBacktestLifecycleTools();
registerBacktestResultTool();

