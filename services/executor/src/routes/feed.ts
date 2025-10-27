import { FastifyInstance } from 'fastify';
import { measureFeedToDb, normalizeBistSymbol, isBistSessionOpen } from "../metrics/feed.js";

export async function feedRoutes(fastify: FastifyInstance) {
  // Mock database interface
  interface TickData {
    symbol: string;
    timestamp: number;
    price: number;
    volume: number;
    venue: string;
  }

  // Mock database insert function
  async function insertTick(tick: TickData): Promise<void> {
    // TODO: Implement actual database insertion
    fastify.log.info('Inserting tick:', tick);
    
    // Simulate database latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
  }

  fastify.post('/feed/tick', async (req, reply) => {
    try {
      const { symbol, price, volume, venue = 'bist' } = req.body as {
        symbol: string;
        price: number;
        volume: number;
        venue?: string;
      };

      // BIST session check
      if (venue === 'bist' && !isBistSessionOpen()) {
        return reply.status(503).send({
          error: 'Market closed',
          reason: 'BIST session is not open',
          nextOpen: '09:30 TR time'
        });
      }

      const normalizedSymbol = venue === 'bist' ? normalizeBistSymbol(symbol) : symbol;
      
      const result = await measureFeedToDb(
        { venue, symbol: normalizedSymbol },
        async () => {
          const tick: TickData = {
            symbol: normalizedSymbol,
            timestamp: Date.now(),
            price,
            volume,
            venue
          };

          await insertTick(tick);
          
          return {
            ok: true,
            symbol: normalizedSymbol,
            timestamp: tick.timestamp,
            processed: true
          };
        }
      );

      reply.send(result);
    } catch (error) {
      fastify.log.error('Feed tick processing error:', error);
      reply.status(500).send({
        error: 'Tick processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  fastify.get('/feed/status', async (req, reply) => {
    try {
      const bistOpen = isBistSessionOpen();
      
      reply.send({
        venues: {
          bist: {
            open: bistOpen,
            nextOpen: bistOpen ? null : '09:30 TR time',
            nextClose: bistOpen ? '18:00 TR time' : null
          }
        },
        timestamp: Date.now()
      });
    } catch (error) {
      fastify.log.error('Feed status error:', error);
      reply.status(500).send({
        error: 'Failed to get feed status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Simulate feed data for testing
  fastify.post('/feed/simulate', async (req, reply) => {
    try {
      const { count = 10, venue = 'bist' } = req.body as {
        count?: number;
        venue?: string;
      };

      const symbols = venue === 'bist' 
        ? ['GARAN.E', 'THYAO.E', 'AKBNK.E', 'BIMAS.E']
        : ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'];

      const results = [];
      
      for (let i = 0; i < count; i++) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const price = 100 + Math.random() * 50;
        const volume = Math.random() * 1000;

        const result = await measureFeedToDb(
          { venue, symbol: venue === 'bist' ? normalizeBistSymbol(symbol) : symbol },
          async () => {
            const tick: TickData = {
              symbol: venue === 'bist' ? normalizeBistSymbol(symbol) : symbol,
              timestamp: Date.now(),
              price,
              volume,
              venue
            };

            await insertTick(tick);
            return tick;
          }
        );

        results.push(result);
      }

      reply.send({
        ok: true,
        processed: results.length,
        results,
        timestamp: Date.now()
      });
    } catch (error) {
      fastify.log.error('Feed simulation error:', error);
      reply.status(500).send({
        error: 'Feed simulation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
