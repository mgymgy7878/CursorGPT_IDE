import fp from "fastify-plugin";
import { dbLite } from "@spark/db-lite";

declare module 'fastify' { interface FastifyInstance { db: typeof dbLite } }

export default fp(async (app) => { app.decorate('db', dbLite); }); 