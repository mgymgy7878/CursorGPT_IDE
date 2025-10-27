import fp from "fastify-plugin";
export default fp(async (app:any)=>{
	const payload = () => ({ ok:true, pid:process.pid, uptime_s: Math.round(process.uptime()), ts: Date.now() });
	app.get('/healthz', async (_req:any, reply:any)=> reply.send(payload()));
	app.post('/healthz', async (_req:any, reply:any)=> reply.send(payload()));
	app.get('/health', async (_req:any, reply:any)=> reply.send(payload()));
	app.post('/health', async (_req:any, reply:any)=> reply.send(payload()));
}); 