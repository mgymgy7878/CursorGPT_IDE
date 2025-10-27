import fp from 'fastify-plugin';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';

export default fp(async function typeProvider(app: FastifyInstance) {
  app.withTypeProvider<TypeBoxTypeProvider>();
});
