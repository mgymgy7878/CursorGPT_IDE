import type { FastifyInstance } from "fastify";
import { getAllowWrite, setAllowWrite } from "../state/allowWrite";
import { requireAdmin } from "../mw/rbac";

export default async function routes(f: FastifyInstance) {
	f.get('/ai/allow-write', async () => ({ allowWrite: getAllowWrite() }));
	f.post('/ai/allow-write', { preHandler: requireAdmin as any }, async (req, rep) => {
		const body = (req.body ?? {}) as any;
		if (typeof body.enable !== 'boolean') return rep.status(400).send({ error: 'enable:boolean required' });
		setAllowWrite(body.enable);
		return { allowWrite: getAllowWrite() };
	});
} 