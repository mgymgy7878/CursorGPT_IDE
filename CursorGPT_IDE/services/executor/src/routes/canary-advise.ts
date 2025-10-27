import fp from "fastify-plugin";
import { registry } from "../plugins/metrics";

export default fp(async (app:any)=>{
	app.post('/canary/advise/script', async (req:any, reply:any)=>{
		const fmt = String((req.query?.format ?? 'sh')).toLowerCase();
		const recv = Number(process.env.RECV_WINDOW_MS ?? 5000);
		const pool = Number(process.env.HTTP_AGENT_MAX_SOCKETS ?? 10);
		const linesSh = [
			'#!/usr/bin/env bash',
			'set -euo pipefail',
			`export BINANCE_RECV_WINDOW=${recv}`,
			`export HTTP_AGENT_MAX_SOCKETS=${pool}`,
			'echo "patched env (sh)"'
		].join('\n');
		const linesPs = [
			'$ErrorActionPreference="Stop"',
			`$env:BINANCE_RECV_WINDOW=${recv}`,
			`$env:HTTP_AGENT_MAX_SOCKETS=${pool}`,
			'Write-Host "patched env (ps1)"'
		].join('\n');
		const body = fmt==='ps1' ? linesPs : linesSh;
		reply.header('Content-Type', fmt==='ps1' ? 'application/x-powershell' : 'text/x-shellscript');
		reply.header('Content-Disposition', `attachment; filename="advisor-patch.${fmt==='ps1'?'ps1':'sh'}"`);
		return reply.send(body);
	});
	app.post('/canary/advise', async (_req:any, reply:any)=>{
		const json = await registry.getMetricsAsJSON();
		const pickQ = (name:string, q:number) => {
			const m = json.find((x:any)=>x.name===name);
			const v = m?.values?.find((y:any)=>y.labels?.quantile===q);
			return Number(v?.value ?? 0);
		};
		const pickC = (name:string) => Number(json.find((x:any)=>x.name===name)?.values?.[0]?.value ?? 0);

		const ack_p95_ms  = pickQ('canary_ack_ms_summary', 0.95);
		const e2db_p95_ms = pickQ('event_to_db_ms_summary', 0.95);
		const confirm     = pickC('canary_confirm_total');
		const fail        = pickC('canary_fail_total');
		const drift_ms    = pickC('clock_drift_ms');

		const advice:string[] = [];
		const patches:Array<{key:string,value:string,why:string}> = [];

		if (ack_p95_ms >= 1000) {
			advice.push('ACK p95 yüksek: HTTP keep-alive ve agent pooling aç, recvWindow’u yükselt.');
			patches.push({ key:'BINANCE_RECV_WINDOW', value:'10000', why:'ACK p95 >= 1000ms' });
			patches.push({ key:'HTTP_KEEP_ALIVE', value:'1', why:'TCP reuse' });
			patches.push({ key:'HTTP_AGENT_MAX_SOCKETS', value:'8', why:'concurrency pool' });
		}
		if (e2db_p95_ms >= 300) {
			advice.push('Event→DB p95 yüksek: insert batch flush ≤50ms & pooled client limit=10.');
			patches.push({ key:'DB_BATCH_FLUSH_MS', value:'50', why:'reduce per-insert overhead' });
			patches.push({ key:'DB_POOL_MAX', value:'10', why:'bound concurrency' });
		}
		if (fail > 0) advice.push('Fail > 0: order path ve minQty/stepSize quantize doğrula.');
		if (Math.abs(drift_ms) > 1000) advice.push('Saat sapması yüksek: NTP senkronizasyonu kontrol et (bilgi amaçlı).');
		if (confirm < 1) advice.push('Hiç confirm yok: /canary/confirm akışını çalıştır.');

		let decision:'GREEN'|'YELLOW'|'RED' = 'RED';
		if (confirm >= 1 && fail === 0 && ack_p95_ms < 1000 && e2db_p95_ms < 300) decision='GREEN';
		else if (confirm >= 1 && fail === 0) decision='YELLOW';

		return reply.send({ decision, ack_p95_ms, e2db_p95_ms, confirm, fail, drift_ms, advice, patches });
	});
}); 