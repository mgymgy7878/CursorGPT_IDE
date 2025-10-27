/// Minimal fastify type stub — sadece derleme için; runtime gerektirmez.
/// fastify gerçek paketi başarıyla kurulunca bu stub kaldırılacak.
declare module "fastify" {
  export interface FastifyRequest<T = any> { body?: T; params?: any; query?: any; headers?: any; }
  export interface FastifyReply { code: (n:number)=>FastifyReply; send: (b:any)=>void; header?: (k:string,v:string)=>FastifyReply; }
  export interface FastifyInstance {
    get: (path:string, h:(req:FastifyRequest, rep:FastifyReply)=>any)=>any;
    post: (path:string, h:(req:FastifyRequest, rep:FastifyReply)=>any)=>any;
    listen: (opts:any)=>Promise<any>;
    log: { info: (...a:any[])=>void; error: (...a:any[])=>void };
  }
  const fastify: (opts?: any) => FastifyInstance;
  export default fastify;
}
