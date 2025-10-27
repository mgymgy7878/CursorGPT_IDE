import { FastifyPluginAsync } from 'fastify';
import { driftGatesMetrics } from "../../../packages/drift-gates/src/metrics.js";

const gatesPlugin: FastifyPluginAsync = async (fastify) => {
  // Initialize drift gates controller
  const gateState = {
    current: 0, // 0=open, 1=closed, 2=recovery, 3=emergency
    lastToggle: Date.now(),
    reason: 'initialized'
  };

  // Gate status endpoint
  fastify.get('/gates/status', async (request, reply) => {
    return {
      gateState: gateState.current,
      lastToggle: new Date(gateState.lastToggle).toISOString(),
      reason: gateState.reason,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });

  // Gate toggle endpoint (requires confirmation)
  fastify.post('/gates/toggle', {
    schema: {
      body: {
        type: 'object',
        required: ['action', 'reason'],
        properties: {
          action: { type: 'string', enum: ['open', 'close', 'recovery', 'emergency'] },
          reason: { type: 'string' },
          confirm_required: { type: 'boolean', default: true }
        }
      }
    }
  }, async (request, reply) => {
    const { action, reason, confirm_required } = request.body as any;
    
    if (confirm_required) {
      return {
        success: false,
        message: 'Gate toggle requires confirmation',
        confirm_required: true,
        action: action,
        reason: reason
      };
    }

    // Update gate state
    const newState = { open: 0, close: 1, recovery: 2, emergency: 3 }[action];
    gateState.current = newState;
    gateState.lastToggle = Date.now();
    gateState.reason = reason;

    // Update metrics
    driftGatesMetrics.gateState.set({ gate_type: 'paper_drift', reason: reason }, newState);
    driftGatesMetrics.gateActionsTotal.inc({ 
      action_type: action, 
      gate_type: 'paper_drift', 
      reason: reason 
    });

    return {
      success: true,
      message: `Gate ${action} successful`,
      gateState: newState,
      reason: reason,
      timestamp: new Date().toISOString()
    };
  });

  // Drift detection endpoint
  fastify.post('/gates/detect-drift', {
    schema: {
      body: {
        type: 'object',
        required: ['pnlDelta', 'slippageBp', 'paperShare'],
        properties: {
          pnlDelta: { type: 'number' },
          slippageBp: { type: 'number' },
          paperShare: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    const { pnlDelta, slippageBp, paperShare } = request.body as any;
    
    // Update drift metrics
    driftGatesMetrics.driftScore.set({ drift_type: 'pnl', market_condition: 'normal' }, Math.abs(pnlDelta));
    driftGatesMetrics.paperLiveDelta.set({ symbol: 'BTC/USD', trade_type: 'spot' }, pnlDelta);
    
    // Check drift thresholds
    const pnlDriftHigh = Math.abs(pnlDelta) > 1.0;
    const slippageSpike = slippageBp > 15;
    const paperShareHigh = paperShare > 80;
    
    if (pnlDriftHigh || slippageSpike || paperShareHigh) {
      driftGatesMetrics.driftEventsTotal.inc({ 
        drift_type: 'pnl', 
        severity: 'warning', 
        market_condition: 'normal' 
      });
      
      return {
        driftDetected: true,
        reasons: {
          pnlDriftHigh,
          slippageSpike,
          paperShareHigh
        },
        recommendations: {
          gateAction: 'close',
          reason: 'Drift thresholds exceeded'
        }
      };
    }
    
    return {
      driftDetected: false,
      message: 'No drift detected'
    };
  });

  // Metrics endpoint
  fastify.get('/gates/metrics', async (request, reply) => {
    reply.type('text/plain');
    return await driftGatesMetrics.register.metrics();
  });
};

export default gatesPlugin;
