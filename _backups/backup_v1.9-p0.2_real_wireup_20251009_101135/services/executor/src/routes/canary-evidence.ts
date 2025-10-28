import type { FastifyInstance } from "fastify";

export default async function routes(f: FastifyInstance) {
	f.get('/audit/export', async (req, reply) => {
		try {
			const content = Buffer.from('audit:demo');
			reply.header('Content-Type','application/zip');
			reply.header('Content-Disposition','attachment; filename="audit.zip"');
			return reply.send(content);
		} catch (e:any) {
			return reply.status(500).send({ error: e?.message || 'export-failed' });
		}
	});
} 