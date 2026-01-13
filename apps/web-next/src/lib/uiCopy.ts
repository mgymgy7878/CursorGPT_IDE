/**
 * UI Copy Dictionary - PATCH V
 *
 * Tek kaynak UI metin sözlüğü. Tüm UI string'leri buradan gelir.
 *
 * KURAL: Hardcoded string'ler yerine bu sözlükten kullanılmalı.
 *
 * @see tools/UI_COPY_STYLE_GUIDE.md
 */

export const uiCopy = {
  // ========== FİİLLER (Actions) ==========
  create: {
    strategy: 'Strateji Oluştur',
    alert: 'Uyarı Oluştur',
    new: 'Yeni',
  },

  analyze: {
    graph: 'Grafiği analiz et',
    portfolioRisk: 'Portföy riskini analiz et',
    drawdown: 'Drawdown analizi',
  },

  summarize: {
    strategies: 'Çalışan stratejileri özetle',
    portfolio: 'Portföy özeti',
  },

  examine: {
    details: 'Detayları incele',
    logs: 'Logları incele',
  },

  test: {
    connection: 'Test Et',
    api: 'API bağlantısını test et',
  },

  save: {
    default: 'Kaydet',
    all: 'Tümünü Kaydet',
    settings: 'Ayarları kaydet',
  },

  // ========== NAVİGASYON ==========
  nav: {
    backToList: 'Listeye Dön',
    backToTable: 'Tabloya Dön', // Deprecated: backToList kullanılacak
    fullscreen: 'Tam Ekran',
    exit: 'Çık',
    close: 'Kapat',
  },

  // ========== TABLO KOLON BAŞLIKLARI ==========
  table: {
    strategy: 'Strateji',
    market: 'Piyasa',
    mode: 'Mod',
    openPositions: 'Açık Poz.',
    exposure: 'Maruziyet',
    pnl24h: 'PnL 24h',
    pnl7d: 'PnL 7d',
    risk: 'Risk',
    health: 'Sağlık',
    status: 'Durum',
    actions: 'İşlemler',
    category: 'Kategori',
    leverage: 'Kaldıraç', // PATCH W.2.1: Türkçeleştirme
    winRate30d: 'Kazanma Oranı 30g', // PATCH W.2.1: Türkçeleştirme
    sharpe30d: 'Sharpe 30g', // PATCH W.2.1: Türkçeleştirme
    symbol: 'Sembol',
    name: 'İsim',
    price: 'Fiyat',
    change: 'Değişim',
    volume: 'Hacim',
    signal: 'Sinyal',
    pnl24hFull: '24s P&L', // PATCH W.2.1: Tam Türkçe
    pnl7dFull: '7g P&L', // PATCH W.2.1: Tam Türkçe
  },

  // ========== RİSK SEVİYELERİ ==========
  risk: {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    level: 'Risk Seviyesi',
  },

  // ========== DURUM ==========
  status: {
    active: 'Aktif',
    paused: 'Duraklatıldı',
    stopped: 'Durduruldu',
    running: 'Çalışıyor',
    inactive: 'Pasif',
    stuck: 'Takıldı',
  },

  // ========== SAĞLIK ==========
  health: {
    ok: 'Sağlıklı', // PATCH W.5: OK → Sağlıklı
    degraded: 'Degrade', // PATCH W.5: Degraded → Degrade
    down: 'Çöktü',
    error: 'Hata',
  },

  // ========== MOD ==========
  mode: {
    live: 'Canlı', // PATCH W.5: Live → Canlı
    shadow: 'Gölge', // PATCH W.5: Shadow → Gölge
  },

  // ========== BAĞLANTI DURUMU ==========
  connection: {
    healthy: 'Sağlıklı', // PATCH W.5: Healthy → Sağlıklı
    moderate: 'Orta', // PATCH W.5: Moderate → Orta
    operational: 'Çalışır', // PATCH W.5: Operational → Çalışır
    connected: 'Bağlı', // PATCH W.5: Connected → Bağlı
  },

  // ========== AI KARAR MESAJLARI ==========
  aiDecision: {
    oversoldConditionMet: 'Aşırı satım koşulu sağlandı', // PATCH W.5: Oversold condition met
    takeProfitTargetHit: 'Kâr al hedefi vuruldu', // PATCH W.5: Take profit target hit
  },

  // ========== SİNYAL ROZETLERİ ==========
  signals: {
    buy: 'AL',
    strongBuy: 'GÜÇLÜ AL',
    hold: 'BEKLE',
    sell: 'SAT',
  },

  // ========== COPILOT CONTEXT ==========
  copilot: {
    context: {
      system: 'Sistem',
      strategy: 'Strateji',
      mode: 'Mod',
    },
    contextValues: {
      normal: 'Normal',
      shadow: 'Gölge', // PATCH W.5: Shadow → Gölge
      live: 'Canlı', // PATCH W.5: Live → Canlı
      none: '—',
    },
  },

  // ========== METRİKLER ==========
  metrics: {
    currentExposure: 'Mevcut Maruziyet',
    dailyLoss: 'Günlük Zarar',
    openOrders: 'Açık Emirler',
    maxDD: 'Max DD',
    maxDrawdown: 'Max Drawdown',
    limit: 'Limit',
    // PATCH W.4: Metrik ribbon label'ları
    winRate30d: 'Kazanma Oranı 30g',
    sharpe30d: 'Sharpe 30g',
    openPositions: 'Açık Pozisyonlar',
    totalPnl24h: 'Toplam P&L 24s',
    totalPnl7d: 'Toplam P&L 7g',
    pnl7d: '7g P&L',
    totalExposure: 'Toplam Maruziyet',
    riskUsed: 'Kullanılan Risk',
    health: 'Sağlık',
    healthStatus: 'Sağlık Durumu', // "2 OK / 1 Degraded" gibi
  },

  // ========== RİSK MODU ==========
  riskMode: {
    shadow: 'Shadow',
    live: 'Live',
  },

  // ========== GENEL ==========
  common: {
    search: 'Ara...',
    searchStrategy: 'Strateji ara...',
    searchSymbol: 'Sembol ara...',
    loading: 'Yükleniyor...',
    error: 'Hata',
    success: 'Başarılı',
    cancel: 'İptal',
    confirm: 'Onayla',
    delete: 'Sil',
    edit: 'Düzenle',
    view: 'Görüntüle',
    close: 'Kapat',
  },

  // ========== TOOLTIP METİNLERİ (PATCH W) ==========
  tooltip: {
    details: 'Detay',
    settings: 'Ayarlar',
    chart: 'Grafik',
    approve: 'Onayla',
    snooze: 'Sustur',
    copy: 'Kopyala',
    pause: 'Duraklat',
    resume: 'Devam Et',
    delete: 'Sil',
    edit: 'Düzenle',
    view: 'Görüntüle',
    fullscreen: 'Tam Ekran',
    backToList: 'Listeye Dön',
  },

  // ========== KILL SWITCH (PATCH W) ==========
  killSwitch: {
    arm: 'Kill Switch\'i Arm Et',
    armed: 'Armed - Basılı Tut (2sn)',
    holdToConfirm: 'Basılı Tut (2sn)',
    confirm: 'Onayla',
    cancel: 'İptal',
    emergencyStop: 'ACİL DURDUR',
    systemNormal: 'Sistem Normal',
    // PATCH W.1: Armed durumu metinleri
    armedStatus: 'Armed',
    disarming: 'Disarming...',
    // PATCH W.1 Polish: Disabled durumda tooltip
    armFirst: 'Önce Arm et',
  },
} as const;

/**
 * Type-safe accessor helper
 */
export type UICopy = typeof uiCopy;

/**
 * Helper: Get nested copy value by path
 *
 * @example
 * getCopy('create.strategy') // 'Strateji Oluştur'
 * getCopy('signals.buy') // 'AL'
 */
export function getCopy(path: string): string {
  const keys = path.split('.');
  let value: any = uiCopy;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key as keyof typeof value];
    } else {
      console.warn(`[uiCopy] Path not found: ${path}`);
      return path; // Fallback to path itself
    }
  }

  return typeof value === 'string' ? value : path;
}

