import type { FastifyInstance } from "fastify";
import { aiService } from "../ai/index.js";

export default async function aiRoutes(fastify: FastifyInstance) {
  // Manager AI endpoint
  fastify.post('/ai/manager', async (request, reply) => {
    try {
      const body = await request.body as { input: string };
      
      if (!body.input) {
        return reply.status(400).send({ 
          ok: false, 
          error: 'input field required' 
        });
      }

      const result = await aiService.managerChat(body.input);
      return reply.send(result);
    } catch (error) {
      console.error('Manager AI error:', error);
      return reply.status(500).send({ 
        ok: false, 
        error: 'Internal server error' 
      });
    }
  });

  // Strategy AI endpoint
  fastify.post('/ai/strategy', async (request, reply) => {
    try {
      const body = await request.body as { input: string };
      
      if (!body.input) {
        return reply.status(400).send({ 
          ok: false, 
          error: 'input field required' 
        });
      }

      const result = await aiService.strategyChat(body.input);
      return reply.send(result);
    } catch (error) {
      console.error('Strategy AI error:', error);
      return reply.status(500).send({ 
        ok: false, 
        error: 'Internal server error' 
      });
    }
  });
} 