const URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1/messages';

export async function* anthropicStream(model: string, prompt: string) {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) { yield '[router:claude] API key yok — dry token'; return; }

	const res = await fetch(`${URL}?stream=true`, {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model,
			max_tokens: Number(process.env.AI_MAX_TOKENS || 512),
			temperature: 0.2,
			messages: [{ role: 'user', content: prompt }],
			system: 'You are Spark Copilot. Never execute trades; only explain.'
		})
	});

	if (!res.ok || !res.body) { throw new Error(`anthropic ${res.status}`); }

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
				const text = j?.delta?.text || j?.content_block?.text || j?.message?.content?.[0]?.text;
				if (text) yield text;
			} catch { /* ignore */ }
		}
	}
} 