type Draft = {
	action: string;
	params: Record<string, unknown>;
	dryRun: boolean;
	confirm_required: boolean;
	reason: string;
};

export function parseKeyVals(raw: string): Record<string,string> {
	const params: Record<string,string> = {};
	raw.split(/\s+/).filter(Boolean).forEach(pair=>{
		const [k, ...rest] = pair.split('=');
		if (!k) return;
		params[k] = rest.join('=') || '1';
	});
	return params;
}

export function makePreviewDraft(action: string, rawParams: string, reason='preview'): Draft {
	const params = parseKeyVals(rawParams);
	return { action, params, dryRun: true, confirm_required: true, reason };
} 