import fp from "fastify-plugin";
export default fp(async (app:any)=>{
	app.get('/positions', async (_req:any, reply:any)=> reply.send({ positions: [] }));
	app.post('/positions', async (_req:any, reply:any)=> reply.send({ positions: [] }));
	app.get('/orders/open', async (_req:any, reply:any)=> reply.send({ orders: [] }));
	app.post('/orders/open', async (_req:any, reply:any)=> reply.send({ orders: [] }));
}); 