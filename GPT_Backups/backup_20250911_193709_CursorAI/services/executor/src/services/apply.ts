const BASE = process.env.EXECUTOR_BASE_INTERNAL || 'http://127.0.0.1:4001';
export async function applyRisk(params: Record<string,unknown>, audit:any) {
	return fetch(`${BASE.replace(/\/+$/,'')}/risk/threshold.set`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...params, audit }) });
}
export async function applyAlert(params: Record<string,unknown>, audit:any) {
	return fetch(`${BASE.replace(/\/+$/,'')}/alerts/create`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...params, audit }) });
}
export async function applyPromote(params: Record<string,unknown>, audit:any) {
	return fetch(`${BASE.replace(/\/+$/,'')}/model/promote`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...params, audit }) });
} 