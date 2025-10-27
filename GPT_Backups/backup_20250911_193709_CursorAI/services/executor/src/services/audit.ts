import { appendFile } from "node:fs/promises";
export async function auditLog(event: string, data: Record<string,unknown>) {
	const line = JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + '\n';
	await appendFile(process.env.AUDIT_LOG_FILE || 'logs/audit.copilot.ndjson', line).catch(()=>{});
} 