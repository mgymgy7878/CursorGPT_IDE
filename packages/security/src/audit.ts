import { mkdirSync, appendFileSync } from "node:fs"
import { dirname } from "node:path"

export interface AuditEvent { ts:number; actor?:string; role?:string; ip?:string; method:string; path:string; status:number; ok:boolean; meta?:any }

export async function audit(ev: AuditEvent): Promise<void> {
  if (process.env.AUDIT_ENABLED !== '1') return
  const p = process.env.AUDIT_LOG_PATH || '.data/audit.log'
  try {
    mkdirSync(dirname(p), { recursive: true })
    appendFileSync(p, JSON.stringify(ev) + '\n', { encoding: 'utf8' })
  } catch (e) {
    // fallback: stdout
    console.log('[audit]', ev)
  }
} 
