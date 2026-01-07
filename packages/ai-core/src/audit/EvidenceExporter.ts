/**
 * Evidence Exporter
 *
 * Exports audit log entries to evidence files for debugging and verification.
 * Creates JSON files in evidence/ directory with tool execution proofs.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { AuditLogEntry } from '../tools/types.js';

export interface EvidenceEntry {
  requestId: string;
  timestamp: number;
  tool: string;
  toolParamsHash: string;
  toolResultHash?: string;
  elapsedMs?: number;
  ok: boolean;
  errorCode?: string;
  sseEventCount?: number;
  auditHash: string;
  prevHash?: string;
  // P0.5: Event tracking
  toolCallTotal?: number;
  toolCallExecuted?: number;
  toolLimitExceeded?: boolean;
  errorCodes?: string[];
  events?: {
    tool_call?: number;
    tool_result?: number;
    tool_limit_exceeded?: number;
    error?: number;
    token?: number;
    done?: number;
  };
  // P0.6: Payload size tracking (for 32KB limit monitoring)
  marketSnapshotBytes?: number;
  // P0.7: Strategy tool tracking
  strategyCountReturned?: number;
  strategyIdRequested?: string;
  codePreviewBytes?: number;
  // P0.8: Backtest tool tracking
  backtestDryRun?: boolean;
  backtestJobId?: string;
  backtestEstimatedBars?: number;
  backtestRangeDays?: number;
  // P1.0: Backtest job lifecycle tracking
  backtestJobLifecycle?: {
    startedAt?: number;
    completedAt?: number;
    finalStatus?: string;
    progressEvents?: number;
  };
  confirmationRequiredCount?: number;
  confirmed?: boolean;
  // P1.1: Backtest result tracking
  backtestResultPreviewBytes?: number;
  backtestResultHash?: string;
  backtestResultTruncated?: boolean;
  backtestResultTruncationReason?: 'trades' | 'equity' | 'metrics';
}

/**
 * Export evidence for a tool execution
 */
export async function exportEvidence(
  auditEntry: AuditLogEntry,
  metadata?: {
    sseEventCount?: number;
    toolParams?: Record<string, any>;
    toolResult?: any;
    eventCounts?: Record<string, number>;
    toolCallTotal?: number;
    toolCallExecuted?: number;
    toolLimitExceeded?: boolean;
    errorCodes?: string[];
    marketSnapshotBytes?: number;
    strategyCountReturned?: number;
    strategyIdRequested?: string;
    codePreviewBytes?: number;
    backtestDryRun?: boolean;
    backtestJobId?: string;
    backtestEstimatedBars?: number;
    backtestRangeDays?: number;
    backtestJobLifecycle?: {
      startedAt?: number;
      completedAt?: number;
      finalStatus?: string;
      progressEvents?: number;
    };
    confirmationRequiredCount?: number;
    confirmed?: boolean;
    // P1.1: Backtest result tracking
    backtestResultPreviewBytes?: number;
    backtestResultHash?: string;
    backtestResultTruncated?: boolean;
    backtestResultTruncationReason?: 'trades' | 'equity' | 'metrics';
  }
): Promise<string> {
  const evidenceDir = join(process.cwd(), 'evidence');

  try {
    await mkdir(evidenceDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `hello_tool_world_${timestamp}.json`;
  const filepath = join(evidenceDir, filename);

  const evidence: EvidenceEntry = {
    requestId: auditEntry.requestId,
    timestamp: auditEntry.timestamp,
    tool: auditEntry.tool,
    toolParamsHash: auditEntry.paramsHash,
    toolResultHash: auditEntry.resultHash,
    elapsedMs: auditEntry.elapsedMs,
    ok: auditEntry.ok ?? true,
    errorCode: auditEntry.errorCode,
    sseEventCount: metadata?.sseEventCount,
    auditHash: auditEntry.auditHash,
    prevHash: auditEntry.prevHash,
    // P0.5: Event tracking
    toolCallTotal: metadata?.toolCallTotal,
    toolCallExecuted: metadata?.toolCallExecuted,
    toolLimitExceeded: metadata?.toolLimitExceeded,
    errorCodes: metadata?.errorCodes,
    events: metadata?.eventCounts,
    marketSnapshotBytes: metadata?.marketSnapshotBytes,
    strategyCountReturned: metadata?.strategyCountReturned,
    strategyIdRequested: metadata?.strategyIdRequested,
    codePreviewBytes: metadata?.codePreviewBytes,
    backtestDryRun: metadata?.backtestDryRun,
    backtestJobId: metadata?.backtestJobId,
    backtestEstimatedBars: metadata?.backtestEstimatedBars,
    backtestRangeDays: metadata?.backtestRangeDays,
    backtestJobLifecycle: metadata?.backtestJobLifecycle,
    confirmationRequiredCount: metadata?.confirmationRequiredCount,
    confirmed: metadata?.confirmed,
    // P1.1: Backtest result tracking
    backtestResultPreviewBytes: metadata?.backtestResultPreviewBytes,
    backtestResultHash: metadata?.backtestResultHash,
    backtestResultTruncated: metadata?.backtestResultTruncated,
    backtestResultTruncationReason: metadata?.backtestResultTruncationReason,
  };

  // Include full params/result for debugging (can be large, but useful)
  const fullEvidence = {
    ...evidence,
    toolParams: metadata?.toolParams,
    toolResult: metadata?.toolResult,
    fullAuditEntry: auditEntry,
  };

  await writeFile(filepath, JSON.stringify(fullEvidence, null, 2), 'utf-8');

  return filepath;
}

/**
 * Export evidence from multiple tool executions (batch)
 */
export async function exportBatchEvidence(
  entries: Array<{
    auditEntry: AuditLogEntry;
    metadata?: {
      sseEventCount?: number;
      toolParams?: Record<string, any>;
      toolResult?: any;
    };
  }>
): Promise<string> {
  const evidenceDir = join(process.cwd(), 'evidence');

  try {
    await mkdir(evidenceDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `hello_tool_world_batch_${timestamp}.json`;
  const filepath = join(evidenceDir, filename);

  const batchEvidence = entries.map(({ auditEntry, metadata }) => ({
    requestId: auditEntry.requestId,
    timestamp: auditEntry.timestamp,
    tool: auditEntry.tool,
    toolParamsHash: auditEntry.paramsHash,
    toolResultHash: auditEntry.resultHash,
    elapsedMs: auditEntry.elapsedMs,
    ok: auditEntry.ok ?? true,
    errorCode: auditEntry.errorCode,
    sseEventCount: metadata?.sseEventCount,
    auditHash: auditEntry.auditHash,
    prevHash: auditEntry.prevHash,
    toolParams: metadata?.toolParams,
    toolResult: metadata?.toolResult,
  }));

  await writeFile(filepath, JSON.stringify(batchEvidence, null, 2), 'utf-8');

  return filepath;
}

