/**
 * Guardrails API Routes
 * Runtime sertleştirme durumu ve kontrolü
 */

import { Router } from 'express';
import { getGuardrailsStatus, settings } from '../guardrails.js';

const router = Router();

/**
 * Guardrails durumu
 */
router.get('/status', (req, res) => {
  try {
    const status = getGuardrailsStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Kill switch kontrolü
 */
router.get('/kill-switch', (req, res) => {
  res.json({
    success: true,
    data: {
      active: settings.killSwitch,
      mode: settings.mode,
      tradingAllowed: !settings.killSwitch
    }
  });
});

/**
 * Trading mode kontrolü
 */
router.get('/trading-mode', (req, res) => {
  res.json({
    success: true,
    data: {
      mode: settings.mode,
      allowed: ['shadow', 'trickle', 'live'].includes(settings.mode),
      killSwitch: settings.killSwitch
    }
  });
});

/**
 * Rate limit durumu
 */
router.get('/rate-limits', (req, res) => {
  res.json({
    success: true,
    data: {
      maxOrdersPerMin: settings.maxOrdersPerMin,
      maxNotionalPerSecTRY: settings.maxNotionalPerSecTRY,
      whitelist: settings.whitelist,
      trickleMaxNotionalTRY: settings.trickleMaxNotionalTRY,
      trickleAllowedSymbols: settings.trickleAllowedSymbols
    }
  });
});

/**
 * SLO thresholds
 */
router.get('/slo-thresholds', (req, res) => {
  res.json({
    success: true,
    data: {
      p95PlaceAckMaxMs: settings.p95PlaceAckMaxMs,
      p95FeedDbMaxMs: settings.p95FeedDbMaxMs,
      nonceErrorRateMax: settings.nonceErrorRateMax,
      rateLimitBurstMax: settings.rateLimitBurstMax,
      clockDriftMaxMs: settings.clockDriftMaxMs
    }
  });
});

export default router;
