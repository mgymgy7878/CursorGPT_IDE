import type { FastifyRequest, FastifyReply } from "fastify";
export function requireAdmin(req: FastifyRequest, reply: FastifyReply, done: (err?: Error)=>void) {
	const role = String((req.headers['x-role'] ?? '')).toLowerCase();
	if (role !== 'admin') return reply.status(403).send({ error: 'forbidden' }) as any;
	done();
}
export function getActor(req: FastifyRequest) {
	return {
		user: String(req.headers['x-user'] ?? 'unknown'),
		role: String(req.headers['x-role'] ?? 'unknown'),
		reason: String(req.headers['x-reason'] ?? 'copilot')
	};
} 