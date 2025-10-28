import { FastifyPluginAsync } from 'fastify';
import { OptimizerController, OptimizerLimits } from "../../../packages/optimization/src/optimizerController.js";
import { OptimizerJob } from "../../../packages/optimization/src/optimizerQueue.js";
import { register } from "../../../packages/optimization/src/metrics.js";

const optimizerPlugin: FastifyPluginAsync = async (fastify) => {
  // Initialize optimizer controller
  const limits: OptimizerLimits = {
    maxConcurrentJobs: 10,
    maxQueueDepth: 200,
    cpuLimitPercent: 80,
    memoryLimitMB: 1024,
    stepLatencyLimitMs: 100,
    queueWaitLimitMs: 1000
  };

  const workerConfig = {
    minWorkers: 2,
    maxWorkers: 8,
    burstCapacity: 4,
    cpuLimit: 80,
    memoryLimit: 1024
  };

  const controller = new OptimizerController(limits, workerConfig);
  await controller.start();

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    await controller.stop();
  });

  // Metrics endpoint
  fastify.get('/optimizer/metrics', async (request, reply) => {
    reply.type('text/plain');
    return await register.metrics();
  });

  // Enqueue job
  fastify.post('/optimizer/enqueue', {
    schema: {
      body: {
        type: 'object',
        required: ['kind', 'priority', 'payload'],
        properties: {
          kind: { type: 'string', enum: ['live', 'paper', 'backtest', 'optimize'] },
          priority: { type: 'string', enum: ['high', 'normal', 'low'] },
          source: { type: 'string', enum: ['api', 'scheduler', 'retry'], default: 'api' },
          payload: { type: 'object' },
          deadline: { type: 'number', default: Date.now() + 300000 }, // 5 minutes default
          maxRetries: { type: 'number', default: 3 }
        }
      }
    }
  }, async (request, reply) => {
    const { kind, priority, source, payload, deadline, maxRetries } = request.body as any;
    
    const job: OptimizerJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      kind,
      priority,
      source,
      payload,
      deadline,
      createdAt: Date.now(),
      status: 'enqueued',
      retryCount: 0,
      maxRetries
    };

    const success = await controller.enqueueJob(job);
    
    if (success) {
      return { 
        success: true, 
        jobId: job.id,
        message: 'Job enqueued successfully' 
      };
    } else {
      return { 
        success: false, 
        message: 'Failed to enqueue job (backpressure or resource limits)' 
      };
    }
  });

  // Get job status
  fastify.get('/optimizer/status/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    
    // In real implementation, would query job status from storage
    return {
      jobId,
      status: 'unknown', // Would be actual status
      message: 'Job status lookup not implemented'
    };
  });

  // Cancel job
  fastify.delete('/optimizer/cancel/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    
    const success = await controller.cancelJob(jobId);
    
    return {
      success,
      jobId,
      message: success ? 'Job canceled successfully' : 'Failed to cancel job'
    };
  });

  // Get optimizer status
  fastify.get('/optimizer/status', async (request, reply) => {
    const status = controller.getStatus();
    
    return {
      ...status,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });

  // Health check
  fastify.get('/optimizer/health', async (request, reply) => {
    const status = controller.getStatus();
    
    return {
      status: status.isHealthy ? 'healthy' : 'unhealthy',
      details: status,
      timestamp: new Date().toISOString()
    };
  });
};

export default optimizerPlugin;
