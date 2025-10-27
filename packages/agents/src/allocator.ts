export type AllocPolicy = 'risk_parity' | 'vol_target'

export function riskParity(weightsHint: Record<string, number>, vols: Record<string, number>) {
	const inv = Object.fromEntries(Object.entries(vols).map(([k, s]) => [k, 1 / Math.max(s, 1e-9)])) as Record<string, number>
	const sum = Object.values(inv).reduce((a, b) => a + b, 0)
	const out: Record<string, number> = {}
	for (const k of Object.keys(inv)) {
		const invValue = inv[k];
		if (invValue !== undefined) {
			out[k] = invValue / (sum || 1)
		}
	}
	return out
}

export function volTarget(curVol: number, target: number) {
	return Math.max(0, Math.min(3, target / Math.max(curVol, 1e-9)))
} 