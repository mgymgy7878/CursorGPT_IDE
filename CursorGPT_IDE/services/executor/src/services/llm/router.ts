import { openaiStream } from "./providers/openai";
import { anthropicStream } from "./providers/anthropic";

type Choice = { provider: 'openai'|'anthropic', model: string, id: string };

function policy(prompt: string): 'fast'|'quality' {
	const mode = (process.env.AI_POLICY || 'auto').toLowerCase();
	if (mode === 'fast') return 'fast';
	if (mode === 'quality') return 'quality';
	return prompt.length < 200 ? 'fast' : 'quality';
}

export function pickModel(prompt: string): Choice {
	const mode = policy(prompt);
	const fastOpenAI = process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini';
	const qualOpenAI = process.env.OPENAI_MODEL_QUALITY || 'gpt-4o';
	const fastClaude = process.env.CLAUDE_MODEL_FAST || 'claude-3-haiku';
	const qualClaude = process.env.CLAUDE_MODEL_QUALITY || 'claude-3.5-sonnet';
	const primaryConfig = process.env.AI_ROUTER_PRIMARY || 'openai:gpt-4o-mini';
	const primary = primaryConfig.split(':')[0] || 'openai';
	const choose = (prov: string) => prov === 'openai'
		? { provider:'openai' as const, model: mode==='fast'?fastOpenAI:qualOpenAI }
		: { provider:'anthropic' as const, model: mode==='fast'?fastClaude:qualClaude };
	const pri = choose(primary);
	return { ...pri, id: `${pri.provider}:${pri.model}` };
}

export async function* routeStream(
	prompt: string,
	onMeta: (meta: string)=>void,
	onChoice: (c: Choice)=>void,
	onFailover:(from:Choice,to:Choice,reason:string)=>void
) {
	const primary = pickModel(prompt);
	onChoice(primary);
	onMeta(`model=${primary.id}`);
	try {
		yield* (primary.provider === 'openai' ? openaiStream(primary.model, prompt) : anthropicStream(primary.model, prompt));
		return;
	} catch (e:any) {
		const reason = e?.message || 'error';
		const backupProv = (process.env.AI_ROUTER_BACKUP || 'anthropic:claude-3.5-sonnet').split(':')[0];
		const backup: Choice = backupProv === 'openai'
			? { provider:'openai', model: process.env.OPENAI_MODEL_QUALITY || 'gpt-4o', id: `openai:${process.env.OPENAI_MODEL_QUALITY || 'gpt-4o'}` }
			: { provider:'anthropic', model: process.env.CLAUDE_MODEL_QUALITY || 'claude-3.5-sonnet', id: `anthropic:${process.env.CLAUDE_MODEL_QUALITY || 'claude-3.5-sonnet'}` };
		onFailover(primary, backup, reason);
		onMeta(`failover=${primary.id}->${backup.id}`);
		yield* (backup.provider === 'openai' ? openaiStream(backup.model, prompt) : anthropicStream(backup.model, prompt));
	}
} 