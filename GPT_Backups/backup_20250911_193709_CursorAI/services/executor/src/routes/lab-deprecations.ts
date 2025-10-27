import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const ALLOWED = new Set(['/lab/backtest','/lab/status','/lab/optimize','/lab/save']);

export default async function labDeprecations(app: FastifyInstance) {
	// Bu catch-all, kayıt sırası gereği allowed olmayan lab route'larını yakalar.
	app.all('/lab/*', async (req: FastifyRequest, reply: FastifyReply) => {
		const url = (req.raw.url || '').split('?')[0];
		if (url && ALLOWED.has(url)) {
			// izinli uçlar, bu handler tarafından işlenmez; 404 ile bir üst route'a bırakıyoruz
			return reply.callNotFound();
		}
		reply
			.code(410)
			.header('Cache-Control','no-store')
			.header('Deprecation','true')
			.header('Sunset','Wed, 01 Oct 2025 00:00:00 GMT')
			.header('Link','</docs/lab-v2>; rel="successor-version"')
			.send({
				ok: false,
				degraded: true,
				reason: 'deprecated_endpoint',
				allowed: Array.from(ALLOWED),
				ts: new Date().toISOString()
			});
	});
} 