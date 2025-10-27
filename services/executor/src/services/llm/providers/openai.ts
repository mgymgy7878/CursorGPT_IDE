const OPENAI_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';

export async function* openaiStream(model: string, prompt: string) {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) { yield '[router:openai] API key yok — dry token'; return; }

	const res = await fetch(OPENAI_URL, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model,
			stream: true,
			messages: [
				{ role: 'system', content: 'You are Spark Copilot. Never execute trades; only explain.' },
				{ role: 'user', content: prompt }
			],
			temperature: 0.2,
			max_tokens: Number(process.env.AI_MAX_TOKENS || 512)
		})
	});

	if (!res.ok || !res.body) { throw new Error(`openai ${res.status}`); }

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buf = '';
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buf += decoder.decode(value, { stream: true });
		const parts = buf.split('\n\n');
		buf = parts.pop() || '';
		for (const part of parts) {
			const line = part.split('\n').find(l => l.startsWith('data: '));
			if (!line) continue;
			const data = line.slice(6).trim();
			if (data === '[DONE]') return;
			try {
				const j = JSON.parse(data);
				const delta = j.choices?.[0]?.delta?.content;
				if (delta) yield delta;
			} catch { /* ignore */ }
		}
	}
} 