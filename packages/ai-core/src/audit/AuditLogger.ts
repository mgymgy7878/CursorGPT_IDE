/**
 * Audit Logger
 *
 * Logs all tool executions for audit trail.
 * Creates immutable audit log entries with hash chains.
 */

import type { AuditLogEntry } from '../tools/types.js';
import { createHash } from 'crypto';

export interface CreateAuditEntryInput {
  requestId: string;
  timestamp: number;
  actor: string;
  role: string;
  tool: string;
  params: Record<string, any>;
  paramsHash: string;
  result?: any;
  resultHash?: string;
  dryRun: boolean;
  confirmRequired: boolean;
  confirmed?: boolean;
  confirmedBy?: string;
  confirmedAt?: number;
  prevHash?: string;
  auditHash?: string;
  elapsedMs?: number;
  ok?: boolean;
  errorCode?: string;
}

export class AuditLogger {
  private entries: AuditLogEntry[] = [];
  private lastHash: string = '';

  /**
   * Create a new audit log entry
   *
   * HARDENING: Fixed format with all required fields:
   * - requestId, ts, actor(userId), role, tool, dryRun, confirmRequired
   * - paramsHash, resultHash
   * - prevHash, auditHash (hash chain)
   * - elapsedMs, ok, errorCode
   */
  createEntry(input: CreateAuditEntryInput): AuditLogEntry {
    // Use provided prevHash or last hash from chain
    const prevHash = input.prevHash || this.lastHash;

    // Calculate audit hash (chain hash)
    const hashInput = `${prevHash}|${input.timestamp}|${input.actor}|${input.role}|${input.tool}|${input.paramsHash}|${input.resultHash || ''}`;
    const auditHash = input.auditHash || createHash('sha256').update(hashInput).digest('hex');

    // Determine ok status
    const ok = input.ok !== undefined ? input.ok : (input.resultHash !== undefined);

    const entry: AuditLogEntry = {
      requestId: input.requestId,
      timestamp: input.timestamp,
      actor: input.actor,
      role: input.role,
      tool: input.tool,
      params: input.params,
      paramsHash: input.paramsHash,
      result: input.result,
      resultHash: input.resultHash,
      dryRun: input.dryRun,
      confirmRequired: input.confirmRequired,
      confirmed: input.confirmed,
      confirmedBy: input.confirmedBy,
      confirmedAt: input.confirmedAt,
      prevHash,
      auditHash,
      elapsedMs: input.elapsedMs,
      ok,
      errorCode: input.errorCode,
    };

    this.entries.push(entry);
    this.lastHash = auditHash;

    // TODO: In production, persist to database
    // For now, just keep in memory (dev mode)

    return entry;
  }

  /**
   * Get all audit entries
   */
  getEntries(): AuditLogEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries by request ID
   */
  getByRequestId(requestId: string): AuditLogEntry | undefined {
    return this.entries.find(e => e.requestId === requestId);
  }

  /**
   * Verify audit chain integrity
   */
  verifyChain(): boolean {
    if (this.entries.length === 0) return true;

    let prevHash = '';
    for (const entry of this.entries) {
      const hashInput = `${prevHash}|${entry.timestamp}|${entry.actor}|${entry.role}|${entry.tool}|${entry.paramsHash}|${entry.resultHash || ''}`;
      const expectedHash = createHash('sha256').update(hashInput).digest('hex');

      if (entry.auditHash !== expectedHash) {
        return false;
      }

      if (entry.prevHash !== prevHash) {
        return false;
      }

      prevHash = entry.auditHash;
    }

    return true;
  }
}

export const auditLogger = new AuditLogger();

