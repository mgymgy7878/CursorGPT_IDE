/// <reference types="node" />
declare module "fastify" {
  // Bazı sürümlerde dar gelebiliyor; minimum gerekli yüzeyi genişletiyoruz.
  interface FastifyBaseLogger {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug?: (...args: any[]) => void;
    child?: (...args: any[]) => FastifyBaseLogger;
  }
}
