import fp from "fastify-plugin";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fusionShadowLoggedTotal, riskReportMsSummary } from "../plugins/metrics";
import { safeStat, envStr } from "@spark/shared";
import { ensureWithin } from "@spark/shared";

export default fp(async (app:any) => {
	// Retrain suggest (mocked PSI/freshness check returning draft artefacts)
	app.post('/fusion/retrain.suggest', async (req:any, reply:any) => {
		const body = req.body || {};
		const modelProdId = String(body?.modelId || body?.modelProdId || 'prod-unknown');
		const reasons = ['PSI_HIGH','FRESHNESS_BREACH'];
		const nonce = Date.now();
		const reportsDir = envStr("RISK_REPORT_DIR") || path.join(process.cwd(),'evidence','reports');
		await fs.mkdir(reportsDir, { recursive:true });
		const artefacts = [
			path.join(reportsDir, `draft_${modelProdId}_${nonce}.csv`),
			path.join(reportsDir, `draft_${modelProdId}_${nonce}.pdf`)
		];
		if (artefacts[0]) try{ await fs.writeFile(artefacts[0], 'ts,feature,value\n'); }catch{}
		if (artefacts[1]) try{ await fs.writeFile(artefacts[1], '%PDF-1.4\n%...'); }catch{}
		const draftModelId = `draft-${modelProdId}-${Math.random().toString(36).slice(2)}`;
		return reply.send({ ok:true, modelProdId, draftModelId, reasons, artefacts });
	});

	// Risk report daily → generate simple CSV/PDF + manifest, zip and return
	app.post('/fusion/risk.report.daily', async (_req:any, reply:any) => {
		const t0 = performance.now();
		const reportsDir = envStr("RISK_REPORT_DIR") || path.join(process.cwd(),'evidence','reports');
		await fs.mkdir(reportsDir, { recursive:true });
		const runHash = crypto.randomBytes(6).toString('hex');
		const base = path.join(reportsDir, `risk_${runHash}`);
		const csv = `${base}.csv`; const pdf = `${base}.pdf`; const manifestPath = `${base}.manifest.json`;
		if (csv) await fs.writeFile(csv, 'symbol,pnl,dd,wr\nBTCUSDT,12.3,3.2,0.55\n');
		if (pdf) await fs.writeFile(pdf, '%PDF-1.4\n%...');
		const manifest = { id: runHash, createdAt: new Date().toISOString(), modelProdId: 'prod-latest', runHash, files:[path.basename(csv), path.basename(pdf)] };
		await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
		const csvStat = csv ? await safeStat(csv) : null;
		const pdfStat = pdf ? await safeStat(pdf) : null;
		const csvSize = csvStat?.size || 0;
		const pdfSize = pdfStat?.size || 0;
		app.db.insertRiskReportManifest({ id: runHash, createdAt: Date.now(), modelProdId: 'prod-latest', runHash, path: manifestPath, fileSizeBytes: (csvSize + pdfSize) });
		const AdmZip = (await import('adm-zip')).default;
		const zip = new AdmZip();
		zip.addLocalFile(csv); zip.addLocalFile(pdf); zip.addLocalFile(manifestPath);
		const buf = zip.toBuffer();
		reply.header('Content-Type','application/zip');
		reply.header('Content-Disposition', `attachment; filename="risk_${runHash}.zip"`);
		riskReportMsSummary.observe(Math.round(performance.now()-t0));
		return reply.send(buf);
	});

	// Example: shadow logging hook (to be called by predict path in real impl)
	app.post('/fusion/model.candidate.set', async (req:any, reply:any)=>{
		const body = req.body||{}; const modelCandId = String(body?.modelId || 'candidate');
		// simple ack; real production would update model registry
		return reply.send({ ok:true, modelCandId });
	});

	// Helper (not in allowlist): internal write shadow log for testing
	app.post('/_internal/fusion/shadow.log', async (req:any, reply:any)=>{
		const b=req.body||{}; app.db.insertShadowLog({ id:crypto.randomUUID(), ts:Date.now(), modelProdId:String(b?.modelProdId||'prod'), modelCandId:b?.modelCandId, probProd:Number(b?.probProd||0), probCand:Number(b?.probCand||0), symbol:b?.symbol, windowMin:b?.windowMin });
		fusionShadowLoggedTotal.inc();
		return reply.send({ ok:true });
	});
}); 