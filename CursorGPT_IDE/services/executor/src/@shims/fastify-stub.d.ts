/// Minimal fastify type stub — sadece derleme için; runtime gerektirmez.
/// fastify gerçek paketi başarıyla kurulunca bu stub kaldırılacak.
declare module "fastify" {
  export interface FastifyRequest<T = any> { body?: T; params?: any; query?: any; headers?: any; raw?: any; routeOptions?: any; method?: string; url?: string }
  export interface FastifyReply { code: (n:number)=>FastifyReply; send: (b:any)=>void; header?: (k:string,v:string)=>FastifyReply; status?: (n:number)=>FastifyReply; statusCode?: number; callNotFound?: ()=>void }
  export interface FastifyInstance {
    get: (path:string | any, h?: any)=>any;
    post: (path:string | any, h?: any)=>any;
    delete?: (path:string | any, h?: any)=>any;
    addHook?: (...args:any[])=>any;
    decorate?: (...args:any[])=>any;
    register?: (...args:any[])=>any;
    withTypeProvider?: <T=any>()=>any;
    listen: (opts:any)=>Promise<any>;
    log: { info: (...a:any[])=>void; warn?: (...a:any[])=>void; error: (...a:any[])=>void };
  }
  export type FastifyPluginCallback = any;
  export type FastifyPluginAsync = any;
  const fastify: (opts?: any) => FastifyInstance;
  export default fastify;
}
