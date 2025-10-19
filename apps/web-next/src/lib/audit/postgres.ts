// Postgres audit adapter
// Production: import { Pool } from 'pg'
// import pool from '@/lib/db/pool'

type AuditEntry = {
  action: string;
  result: "ok" | "err";
  strategyId?: string;
  traceId?: string;
  timestamp: number;
  details?: string;
};

export async function writeAudit(entry: AuditEntry): Promise<{ ok: boolean; _err?: string }> {
  // Production implementation:
  /*
  const dbUrl = process.env.AUDIT_DB_URL;
  
  if (!dbUrl) {
    console.warn("[Audit] AUDIT_DB_URL not configured, falling back to executor proxy");
    return { ok: false, _err: "db_not_configured" };
  }
  
  try {
    const pool = new Pool({ connectionString: dbUrl, max: 5, idleTimeoutMillis: 30000 });
    
    const result = await pool.query(
      `INSERT INTO audit_log (ts, action, result, strategy_id, trace_id, details)
       VALUES (to_timestamp($1 / 1000.0), $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        entry.timestamp,
        entry.action,
        entry.result,
        entry.strategyId || null,
        entry.traceId || null,
        entry.details ? JSON.stringify({ details: entry.details }) : null
      ]
    );
    
    return { ok: true, id: result.rows[0].id };
  } catch (e: any) {
    console.error("[Audit] Postgres write failed:", e.message);
    return { ok: false, _err: e.message };
  }
  */
  
  // Mock implementation (returns not-configured)
  return { ok: false, _err: "postgres_not_configured" };
}

export async function readAudit(limit = 10): Promise<{ items: AuditEntry[]; _err?: string; _mock?: boolean }> {
  // Production implementation:
  /*
  const dbUrl = process.env.AUDIT_DB_URL;
  
  if (!dbUrl) {
    return { items: [], _err: "db_not_configured", _mock: true };
  }
  
  try {
    const pool = new Pool({ connectionString: dbUrl });
    
    const result = await pool.query(
      `SELECT 
        extract(epoch from ts)::bigint * 1000 as timestamp,
        action,
        result,
        strategy_id as "strategyId",
        trace_id as "traceId",
        details->>'details' as details,
        id::text as id
       FROM audit_log
       ORDER BY ts DESC
       LIMIT $1`,
      [limit]
    );
    
    return { 
      items: result.rows.map(row => ({
        id: row.id,
        action: row.action,
        result: row.result,
        timestamp: parseInt(row.timestamp),
        strategyId: row.strategyId,
        traceId: row.traceId,
        details: row.details
      }))
    };
  } catch (e: any) {
    console.error("[Audit] Postgres read failed:", e.message);
    return { items: [], _err: e.message };
  }
  */
  
  // Mock implementation
  return { items: [], _err: "postgres_not_configured", _mock: true };
}

