/**
 * Veri Bütünlüğü & Audit - Pratik Şema
 * Gerçek emir ölçümünü denetlenebilir yapma
 */

export interface OrderAudit {
  id: string;
  ts: Date;
  mode: 'shadow' | 'trickle' | 'live';
  exchange: 'btcturk' | 'bist';
  symbol: string;
  route: string; // spot.limit, spot.market, vb.
  clientOrderId: string;
  placeLatencyS?: number; // Place→ACK ölçümü (ACK geldiyse)
  status: 'placed' | 'acked' | 'rejected' | 'timeout';
  errorCode?: string;
  errorMessage?: string;
  notionalTRY?: number;
  qty?: string;
  price?: string;
  side?: 'buy' | 'sell';
}

/**
 * In-memory audit store (production'da Prisma/DB olacak)
 */
class AuditStore {
  private orders: OrderAudit[] = [];
  private maxSize = 10000; // Son 10k emir

  async create(data: Omit<OrderAudit, 'id' | 'ts'>): Promise<OrderAudit> {
    const audit: OrderAudit = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ts: new Date(),
      ...data
    };

    this.orders.push(audit);
    
    // Size limit
    if (this.orders.length > this.maxSize) {
      this.orders = this.orders.slice(-this.maxSize);
    }

    return audit;
  }

  async findByClientOrderId(clientOrderId: string): Promise<OrderAudit | null> {
    return this.orders.find(o => o.clientOrderId === clientOrderId) || null;
  }

  async findBySymbol(symbol: string, limit = 100): Promise<OrderAudit[]> {
    return this.orders
      .filter(o => o.symbol === symbol)
      .slice(-limit)
      .reverse();
  }

  async findByMode(mode: string, limit = 100): Promise<OrderAudit[]> {
    return this.orders
      .filter(o => o.mode === mode)
      .slice(-limit)
      .reverse();
  }

  async getStats(): Promise<{
    total: number;
    byMode: Record<string, number>;
    byStatus: Record<string, number>;
    byExchange: Record<string, number>;
    avgLatency: number;
    errorRate: number;
  }> {
    const total = this.orders.length;
    const byMode: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byExchange: Record<string, number> = {};
    
    let totalLatency = 0;
    let latencyCount = 0;
    let errorCount = 0;

    for (const order of this.orders) {
      byMode[order.mode] = (byMode[order.mode] || 0) + 1;
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      byExchange[order.exchange] = (byExchange[order.exchange] || 0) + 1;
      
      if (order.placeLatencyS !== undefined) {
        totalLatency += order.placeLatencyS;
        latencyCount++;
      }
      
      if (order.status === 'rejected' || order.status === 'timeout') {
        errorCount++;
      }
    }

    return {
      total,
      byMode,
      byStatus,
      byExchange,
      avgLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
      errorRate: total > 0 ? errorCount / total : 0
    };
  }

  async getRecentErrors(limit = 50): Promise<OrderAudit[]> {
    return this.orders
      .filter(o => o.status === 'rejected' || o.status === 'timeout')
      .slice(-limit)
      .reverse();
  }
}

// Global audit store instance
export const auditStore = new AuditStore();

/**
 * Emir audit kaydı oluştur
 */
export async function auditOrder(data: Omit<OrderAudit, 'id' | 'ts'>): Promise<OrderAudit> {
  return await auditStore.create(data);
}

/**
 * Emir durumu güncelle
 */
export async function updateOrderStatus(
  clientOrderId: string, 
  status: OrderAudit['status'],
  placeLatencyS?: number,
  errorCode?: string,
  errorMessage?: string
): Promise<boolean> {
  const order = await auditStore.findByClientOrderId(clientOrderId);
  if (!order) {
    return false;
  }

  // Update order in store
  order.status = status;
  if (placeLatencyS !== undefined) {
    order.placeLatencyS = placeLatencyS;
  }
  if (errorCode) {
    order.errorCode = errorCode;
  }
  if (errorMessage) {
    order.errorMessage = errorMessage;
  }

  return true;
}

/**
 * Audit istatistikleri
 */
export async function getAuditStats() {
  return await auditStore.getStats();
}

/**
 * Son hatalar
 */
export async function getRecentErrors() {
  return await auditStore.getRecentErrors();
}

/**
 * Sembol bazında emirler
 */
export async function getOrdersBySymbol(symbol: string) {
  return await auditStore.findBySymbol(symbol);
}

/**
 * Mode bazında emirler
 */
export async function getOrdersByMode(mode: string) {
  return await auditStore.findByMode(mode);
}

/**
 * Audit test fonksiyonu
 */
export async function testAudit() {
  console.log('Testing audit system...');
  
  try {
    // Test order creation
    const order1 = await auditOrder({
      mode: 'shadow',
      exchange: 'btcturk',
      symbol: 'BTCTRY',
      route: 'spot.limit',
      clientOrderId: 'test_001',
      status: 'placed',
      notionalTRY: 100,
      qty: '0.001',
      price: '100000',
      side: 'buy'
    });
    console.log('✓ Created audit order:', order1.id);
    
    // Test status update
    await updateOrderStatus('test_001', 'acked', 0.5);
    console.log('✓ Updated order status');
    
    // Test stats
    const stats = await getAuditStats();
    console.log('✓ Audit stats:', stats);
    
  } catch (e) {
    console.error('✗ Audit test failed:', e.message);
  }
}
