export async function getAdvice(): Promise<string> {
	const base = process.env.EXECUTOR_BASE_INTERNAL || 'http://127.0.0.1:4001';
	const r = await fetch(`${base.replace(/\/+$/,'')}/advisor/suggest`, { method: 'POST' });
	const j = await r.json().catch(()=>({}));
	const adv = Array.isArray(j.advices) ? j.advices.slice(0,3).join(' | ') : '-';
	const risk = j.risk?.level ?? '-';
	return [
		'TL;DR — birleşik öneri',
		`Risk seviyesi: ${risk}`,
		`Öneriler: ${adv || '-'}`,
		'Kanıt: /advisor/suggest artefakt'
	].join('\n');
} 