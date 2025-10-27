import type { FastifyReply, FastifyRequest } from 'fastify';

export type Role = 'admin' | 'viewer';

export function rbac(required: Role) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const role = (req.headers['x-role'] as string | undefined)?.toLowerCase();
    const actor = (req.headers['x-actor'] as string | undefined);

    if (!role || !actor) {
      return reply.status(400).send({ error: 'Missing headers: x-role and X-Actor are required' });
    }

    if (required === 'admin' && role !== 'admin') {
      return reply.status(403).send({ error: 'Admin role required' });
    }

    // Prod hardening: admin dışında POST/DELETE yok
    if ((req.method === 'POST' || req.method === 'DELETE') && role !== 'admin') {
      return reply.status(403).send({ error: 'Admin role required for POST/DELETE operations' });
    }

    // Soft audit breadcrumb (route-level audit aşağıda eklenecek)
    req.log.info({ role, actor, url: req.url, method: req.method }, 'RBAC pass');
  };
}