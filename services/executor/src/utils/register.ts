import type { FastifyInstance, FastifyPluginAsync, FastifyPluginCallback } from 'fastify';

export function coercePlugin(mod: any): FastifyPluginAsync | FastifyPluginCallback {
  const plugin = (mod && typeof mod === 'object' && 'default' in mod) ? mod.default : mod;
  if (typeof plugin !== 'function') {
    throw new Error(`Fastify plugin must be a function. Got: ${typeof plugin}`);
  }
  return plugin;
}

export function registerCompat(app: FastifyInstance, mod: any, opts?: Record<string, any>) {
  const plugin = coercePlugin(mod);
  app.register(plugin as any, opts);
}
