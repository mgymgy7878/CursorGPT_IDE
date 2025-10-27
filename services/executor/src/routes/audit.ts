/**
 * Audit API Routes
 * Veri bütünlüğü ve emir audit endpoint'leri
 */

import { Router } from 'express';
import { 
  getAuditStats, 
  getRecentErrors, 
  getOrdersBySymbol, 
  getOrdersByMode 
} from '../audit.js';

const router = Router();

/**
 * Audit istatistikleri
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getAuditStats();
    res.json({
      success: true,
      data: stats,
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
 * Son hatalar
 */
router.get('/errors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const errors = await getRecentErrors();
    res.json({
      success: true,
      data: errors.slice(0, limit),
      count: errors.length,
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
 * Sembol bazında emirler
 */
router.get('/orders/symbol/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const orders = await getOrdersBySymbol(symbol);
    res.json({
      success: true,
      data: orders.slice(0, limit),
      count: orders.length,
      symbol,
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
 * Mode bazında emirler
 */
router.get('/orders/mode/:mode', async (req, res) => {
  try {
    const { mode } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const orders = await getOrdersByMode(mode);
    res.json({
      success: true,
      data: orders.slice(0, limit),
      count: orders.length,
      mode,
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
 * Audit health check
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await getAuditStats();
    res.json({
      success: true,
      data: {
        healthy: true,
        totalOrders: stats.total,
        errorRate: stats.errorRate,
        avgLatency: stats.avgLatency
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
