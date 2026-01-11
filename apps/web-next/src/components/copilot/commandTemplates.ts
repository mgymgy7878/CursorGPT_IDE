/**
 * Copilot Command Templates - Komut Şablonları
 *
 * Kullanıcı "/" yazınca veya quick command chip'lerine tıklayınca
 * bu şablonlar kullanılır.
 */

export interface CommandTemplate {
  id: string;
  label: string;
  prompt: string;
  scope: 'dashboard' | 'market-data' | 'strategy-lab' | 'running' | 'strategies' | 'all';
  icon?: string;
  /** PATCH G: Bu komut için gerekli bağlam alanları */
  requiresContext?: Array<'symbol' | 'timeframe' | 'price' | 'change' | 'rsi' | 'strategyId' | 'strategyName' | 'health' | 'risk' | 'pnl' | 'exposure' | 'openPositions'>;
}

export const COMMAND_TEMPLATES: CommandTemplate[] = [
  // Dashboard scope
  {
    id: 'analyze-portfolio-risk',
    label: 'Portföy riskini analiz et',
    prompt: 'Portföy riskini analiz et ve kritik risk faktörlerini özetle.',
    scope: 'dashboard',
    icon: '📊',
  },
  {
    id: 'summarize-strategies',
    label: 'Çalışan stratejileri özetle',
    prompt: 'Çalışan tüm stratejilerin performansını özetle ve öne çıkan noktaları belirt.',
    scope: 'dashboard',
    icon: '📈',
  },
  {
    id: 'today-trade-suggestion',
    label: 'Bugün için işlem önerisi',
    prompt: 'Bugünkü piyasa rejimine göre en uygun işlem önerilerini sun.',
    scope: 'dashboard',
    icon: '💡',
  },

  // Market Data scope
  {
    id: 'analyze-chart',
    label: 'Bu grafiği analiz et',
    prompt: 'Mevcut grafiği teknik analiz açısından değerlendir ve önemli seviyeleri belirt.',
    scope: 'market-data',
    icon: '📉',
    requiresContext: ['symbol', 'timeframe', 'price', 'change'],
  },
  {
    id: 'critical-levels',
    label: 'Kritik seviyeler',
    prompt: 'Bu sembol için kritik destek ve direnç seviyelerini belirle.',
    scope: 'market-data',
    icon: '🎯',
    requiresContext: ['symbol', 'price', 'rsi'],
  },
  {
    id: 'extract-setup',
    label: 'Setup çıkar',
    prompt: 'Mevcut grafikten trade setup\'ı çıkar ve entry/TP/SL seviyelerini öner.',
    scope: 'market-data',
    icon: '⚡',
    requiresContext: ['symbol', 'timeframe', 'price', 'change', 'rsi'],
  },

  // Strategy Lab scope
  {
    id: 'improve-strategy',
    label: 'Stratejiyi iyileştir',
    prompt: 'Mevcut stratejiyi analiz et ve iyileştirme önerileri sun.',
    scope: 'strategy-lab',
    icon: '🔧',
    requiresContext: ['strategyId', 'strategyName'],
  },
  {
    id: 'parameter-suggestion',
    label: 'Parametre öner',
    prompt: 'Strateji parametreleri için optimize edilmiş değerler öner.',
    scope: 'strategy-lab',
    icon: '🎛️',
    requiresContext: ['strategyId'],
  },
  {
    id: 'risk-gate-check',
    label: 'Risk gate kontrol',
    prompt: 'Stratejinin risk gate\'lerini kontrol et ve uygunluk durumunu değerlendir.',
    scope: 'strategy-lab',
    icon: '🛡️',
    requiresContext: ['strategyId', 'risk'],
  },

  // All scope
  {
    id: 'generate-alert',
    label: 'Uyarı üret',
    prompt: 'Mevcut piyasa durumuna göre uygun uyarı kuralları öner.',
    scope: 'all',
    icon: '🔔',
  },
  {
    id: 'drawdown-analysis',
    label: 'Drawdown analizi',
    prompt: 'Portföy ve stratejilerin drawdown durumunu analiz et.',
    scope: 'all',
    icon: '📉',
  },
];

/**
 * Get command templates for a specific scope
 */
export function getTemplatesForScope(scope: string): CommandTemplate[] {
  return COMMAND_TEMPLATES.filter(
    t => t.scope === scope || t.scope === 'all'
  );
}

/**
 * Find template by ID
 */
export function findTemplateById(id: string): CommandTemplate | undefined {
  return COMMAND_TEMPLATES.find(t => t.id === id);
}

