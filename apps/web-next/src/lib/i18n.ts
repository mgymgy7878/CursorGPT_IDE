/**
 * Hafif i18n sistemi - Türkçe/İngilizce metin yönetimi
 * next-intl veya @lingui'ye geçiş öncesi geçici çözüm
 */

export type Locale = 'tr' | 'en';

// Türkçe metinler (ana sözlük)
const tr = {
  // Genel
  'common.loading': 'Yükleniyor...',
  'common.error': 'Hata',
  'common.success': 'Başarılı',
  'common.cancel': 'İptal',
  'common.save': 'Kaydet',
  'common.delete': 'Sil',
  'common.edit': 'Düzenle',
  'common.close': 'Kapat',
  'common.refresh': 'Yenile',
  'common.search': 'Ara',
  'common.filter': 'Filtrele',
  'common.sort': 'Sırala',
  
  // Durum mesajları
  'status.online': 'Çevrimiçi',
  'status.offline': 'Çevrimdışı',
  'status.checking': 'Kontrol ediliyor...',
  'status.connected': 'Bağlandı',
  'status.disconnected': 'Bağlantı kesildi',
  'status.unknown': 'Bilinmiyor',
  
  // Servis durumları
  'service.api': 'API',
  'service.ws': 'WS',
  'service.executor': 'Executor',
  'service.dev_mode': 'Geliştirici modu',
  'service.dev_mode_desc': '— gerçek tick akışı yok',
  'service.ws_connected': 'WS bağlantısı kuruldu',
  'service.ws_disconnected': 'WS bağlantısı yok',
  
  // Sayfa başlıkları
  'page.dashboard': 'Dashboard',
  'page.market': 'Piyasa Verileri',
  'page.strategy_lab': 'Strateji Lab',
  'page.strategies': 'Stratejilerim',
  'page.running': 'Çalışan Stratejiler',
  'page.portfolio': 'Portföy',
  'page.alerts': 'Uyarılar',
  'page.audit': 'Denetim',
  'page.settings': 'Ayarlar',
  'page.guardrails': 'Risk/Koruma',
  
  // Menü
  'nav.home': 'Anasayfa',
  'nav.market_data': 'Piyasa Verileri',
  'nav.strategy_lab': 'Strateji Lab',
  'nav.my_strategies': 'Stratejilerim',
  'nav.running_strategies': 'Çalışan Stratejiler',
  'nav.portfolio': 'Portföy',
  'nav.alerts': 'Uyarılar',
  'nav.audit': 'Denetim',
  'nav.settings': 'Ayarlar',
  'nav.guardrails': 'Risk/Koruma',
  
  // Dashboard
  'dashboard.title': 'Spark Trading Dashboard',
  'dashboard.balance': 'Bakiye',
  'dashboard.pnl_24h': 'P&L 24H',
  'dashboard.running': 'Çalışan',
  'dashboard.alerts': 'Uyarı',
  'dashboard.latency_p95': 'P95 gecikme',
  'dashboard.latency_target': 'Hedef: 1200 ms',
  'dashboard.freshness_delay': 'Güncellik gecikme',
  'dashboard.freshness_threshold': 'Eşik: 30 sn',
  'dashboard.create_strategy': 'Strateji Oluştur',
  'dashboard.create_alert': 'Uyarı Oluştur',
  
  // Piyasa
  'market.title': 'Piyasa Verileri',
  'market.subtitle': 'Canlı piyasa verileri, fiyatlar ve teknik analiz',
  'market.quick_alert': 'Hızlı Uyarı',
  'market.volume_24h': '24s Hacim',
  
  // Portföy
  'portfolio.title': 'Portföy',
  'portfolio.subtitle': 'Canlı pozisyonlar, PnL ve borsa durumu',
  'portfolio.total_balance': 'Toplam Bakiye',
  'portfolio.available': 'Kullanılabilir',
  'portfolio.asset': 'Varlık',
  'portfolio.amount': 'Miktar',
  'portfolio.price': 'Fiyat',
  'portfolio.pnl_dollar': 'PnL $',
  'portfolio.pnl_percent': 'PnL %',
  'portfolio.action': 'Aksiyon',
  'portfolio.close_position': 'Pozisyonu kapat',
  'portfolio.reverse_position': 'Ters pozisyon aç',
  
  // Stratejiler
  'strategies.title': 'Stratejilerim',
  'strategies.subtitle': 'Stratejilerinizi yönetin ve performanslarını takip edin',
  'strategies.new_strategy': 'Yeni Strateji',
  'strategies.no_strategies': 'Henüz strateji bulunmuyor',
  'strategies.no_strategies_desc': 'İlk strateginizi oluşturmak için yukarıdaki "Yeni Strateji" butonuna tıklayın.',
  'strategies.go_to_strategies': 'Stratejilere Git',
  'strategies.ops_help': 'Ops Hızlı Yardım',
  
  // Strateji Lab
  'strategy_lab.title': 'Strateji Lab',
  'strategy_lab.generate': 'Üret',
  'strategy_lab.backtest': 'Backtest',
  'strategy_lab.optimization': 'Optimizasyon',
  'strategy_lab.deploy': 'Dağıt',
  'strategy_lab.ai_generate': 'AI ile Strateji Üret',
  'strategy_lab.ai_desc': 'Trading strateginizi doğal dille tarif edin, AI sizin için kod üretsin.',
  'strategy_lab.description': 'Strateji Açıklaması',
  'strategy_lab.description_placeholder': 'Örnek: BTCUSDT 1h EMA crossover stratejisi, 10 günlük EMA 20 günlük EMA\'yı yukarı kestiğinde al...',
  'strategy_lab.go_to_backtest': 'Backtest\'e Geç',
  
  // Uyarılar
  'alerts.title': 'Uyarılar',
  'alerts.subtitle': 'Alert yönetimi ve geçmiş',
  'alerts.no_alerts': 'Henüz alert yok',
  'alerts.no_alerts_desc': 'Teknik analiz sayfasından hızlı uyarı oluşturabilirsiniz',
  'alerts.quick_alert': 'Hızlı Uyarı',
  'alerts.technical_analysis': 'Technical Analysis',
  
  // Denetim
  'audit.title': 'Denetim Kayıtları',
  'audit.subtitle': 'Sistem aktiviteleri ve güvenlik logları',
  'audit.actor': 'Oyuncu',
  'audit.action': 'Eylem',
  'audit.search': 'Ara (q)',
  'audit.time': 'Zaman',
  'audit.target': 'Hedef',
  'audit.status': 'Durum',
  'audit.audit_id': 'Denetim Kimliği',
  'audit.total': 'Toplam',
  
  // Ayarlar
  'settings.title': 'Ayarlar',
  'settings.subtitle': 'API anahtarları ve bağlantı ayarları',
  'settings.exchange_api': 'Borsa API',
  'settings.binance': 'Binance',
  'settings.api_key': 'API Key',
  'settings.secret_key': 'Secret Key',
  'settings.show': 'Göster',
  'settings.test': 'Test Et',
  'settings.ai_copilot': 'AI / Copilot',
  
  // Risk/Koruma
  'guardrails.title': 'Risk/Koruma',
  'guardrails.subtitle': 'Risk yönetimi, koruma kuralları ve limit kontrolleri',
  'guardrails.no_rules': 'Henüz koruma kuralı yok',
  'guardrails.no_rules_desc': 'Risk yönetimi kurallarınızı hızlı şablonlardan oluşturabilir veya özel kural tanımlayabilirsiniz',
  'guardrails.daily_loss_limit': 'Günlük Zarar Limiti',
  'guardrails.daily_loss_desc': 'Günlük toplam zarar %3\'ü geçerse tüm pozisyonları otomatik kapat',
  'guardrails.single_trade_max': 'Tek İşlem Max Risk',
  'guardrails.single_trade_desc': 'Tek işlem portföy değerinin %2\'sini geçemez, limiti aşarsa reddet',
  
  // Çalışan Stratejiler
  'running.title': 'Çalışan Stratejiler',
  'running.subtitle': 'Aktif stratejilerin durumu ve performansı',
  'running.no_strategies': 'Şu anda çalışan strateji yok',
  'running.no_strategies_desc': 'Stratejilerim sayfasından mevcut bir stratejiyi başlatabilir veya yeni strateji oluşturabilirsiniz',
  'running.go_to_strategies': 'Stratejilere Git',
  
  // Genel
  'general.copilot': 'Copilot',
  'general.protection_validate': 'Koruma Doğrulama',
  'general.error_budget': 'EB',
} as const;

// İngilizce metinler (fallback)
const en = {
  // Genel
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.refresh': 'Refresh',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.sort': 'Sort',
  
  // Durum mesajları
  'status.online': 'Online',
  'status.offline': 'Offline',
  'status.checking': 'Checking...',
  'status.connected': 'Connected',
  'status.disconnected': 'Disconnected',
  'status.unknown': 'Unknown',
  
  // Servis durumları
  'service.api': 'API',
  'service.ws': 'WS',
  'service.executor': 'Executor',
  'service.dev_mode': 'Dev Mode',
  'service.dev_mode_desc': '— no real tick flow',
  'service.ws_connected': 'WS connection established',
  'service.ws_disconnected': 'WS connection lost',
  
  // Sayfa başlıkları
  'page.dashboard': 'Dashboard',
  'page.market': 'Market Data',
  'page.strategy_lab': 'Strategy Lab',
  'page.strategies': 'My Strategies',
  'page.running': 'Running Strategies',
  'page.portfolio': 'Portfolio',
  'page.alerts': 'Alerts',
  'page.audit': 'Audit',
  'page.settings': 'Settings',
  'page.guardrails': 'Risk/Protection',
  
  // Menü
  'nav.home': 'Home',
  'nav.market_data': 'Market Data',
  'nav.strategy_lab': 'Strategy Lab',
  'nav.my_strategies': 'My Strategies',
  'nav.running_strategies': 'Running Strategies',
  'nav.portfolio': 'Portfolio',
  'nav.alerts': 'Alerts',
  'nav.audit': 'Audit',
  'nav.settings': 'Settings',
  'nav.guardrails': 'Risk/Protection',
  
  // Dashboard
  'dashboard.title': 'Spark Trading Dashboard',
  'dashboard.balance': 'Balance',
  'dashboard.pnl_24h': 'P&L 24H',
  'dashboard.running': 'Running',
  'dashboard.alerts': 'Alerts',
  'dashboard.latency_p95': 'P95 latency',
  'dashboard.latency_target': 'Target: 1200 ms',
  'dashboard.freshness_delay': 'Freshness delay',
  'dashboard.freshness_threshold': 'Threshold: 30s',
  'dashboard.create_strategy': 'Create Strategy',
  'dashboard.create_alert': 'Create Alert',
  
  // Piyasa
  'market.title': 'Market Data',
  'market.subtitle': 'Live market data, prices and technical analysis',
  'market.quick_alert': 'Quick Alert',
  'market.volume_24h': '24h Volume',
  
  // Portföy
  'portfolio.title': 'Portfolio',
  'portfolio.subtitle': 'Live positions, PnL and exchange status',
  'portfolio.total_balance': 'Total Balance',
  'portfolio.available': 'Available',
  'portfolio.asset': 'Asset',
  'portfolio.amount': 'Amount',
  'portfolio.price': 'Price',
  'portfolio.pnl_dollar': 'PnL $',
  'portfolio.pnl_percent': 'PnL %',
  'portfolio.action': 'Action',
  'portfolio.close_position': 'Close position',
  'portfolio.reverse_position': 'Open reverse position',
  
  // Stratejiler
  'strategies.title': 'My Strategies',
  'strategies.subtitle': 'Manage your strategies and track their performance',
  'strategies.new_strategy': 'New Strategy',
  'strategies.no_strategies': 'No strategies found',
  'strategies.no_strategies_desc': 'Click "New Strategy" above to create your first strategy.',
  'strategies.go_to_strategies': 'Go to Strategies',
  'strategies.ops_help': 'Ops Quick Help',
  
  // Strateji Lab
  'strategy_lab.title': 'Strategy Lab',
  'strategy_lab.generate': 'Generate',
  'strategy_lab.backtest': 'Backtest',
  'strategy_lab.optimization': 'Optimization',
  'strategy_lab.deploy': 'Deploy',
  'strategy_lab.ai_generate': 'AI Strategy Generation',
  'strategy_lab.ai_desc': 'Describe your trading strategy in natural language, AI will generate the code for you.',
  'strategy_lab.description': 'Strategy Description',
  'strategy_lab.description_placeholder': 'Example: BTCUSDT 1h EMA crossover strategy, buy when 10-day EMA crosses above 20-day EMA...',
  'strategy_lab.go_to_backtest': 'Go to Backtest',
  
  // Uyarılar
  'alerts.title': 'Alerts',
  'alerts.subtitle': 'Alert management and history',
  'alerts.no_alerts': 'No alerts yet',
  'alerts.no_alerts_desc': 'Create quick alerts from the technical analysis page',
  'alerts.quick_alert': 'Quick Alert',
  'alerts.technical_analysis': 'Technical Analysis',
  
  // Denetim
  'audit.title': 'Audit Logs',
  'audit.subtitle': 'System activities and security logs',
  'audit.actor': 'Actor',
  'audit.action': 'Action',
  'audit.search': 'Search (q)',
  'audit.time': 'Time',
  'audit.target': 'Target',
  'audit.status': 'Status',
  'audit.audit_id': 'Audit ID',
  'audit.total': 'Total',
  
  // Ayarlar
  'settings.title': 'Settings',
  'settings.subtitle': 'API keys and connection settings',
  'settings.exchange_api': 'Exchange API',
  'settings.binance': 'Binance',
  'settings.api_key': 'API Key',
  'settings.secret_key': 'Secret Key',
  'settings.show': 'Show',
  'settings.test': 'Test',
  'settings.ai_copilot': 'AI / Copilot',
  
  // Risk/Koruma
  'guardrails.title': 'Risk/Protection',
  'guardrails.subtitle': 'Risk management, protection rules and limit controls',
  'guardrails.no_rules': 'No protection rules yet',
  'guardrails.no_rules_desc': 'Create risk management rules from quick templates or define custom rules',
  'guardrails.daily_loss_limit': 'Daily Loss Limit',
  'guardrails.daily_loss_desc': 'Automatically close all positions if daily total loss exceeds 3%',
  'guardrails.single_trade_max': 'Single Trade Max Risk',
  'guardrails.single_trade_desc': 'Single trade cannot exceed 2% of portfolio value, reject if limit exceeded',
  
  // Çalışan Stratejiler
  'running.title': 'Running Strategies',
  'running.subtitle': 'Status and performance of active strategies',
  'running.no_strategies': 'No strategies currently running',
  'running.no_strategies_desc': 'Start an existing strategy from My Strategies page or create a new one',
  'running.go_to_strategies': 'Go to Strategies',
  
  // Genel
  'general.copilot': 'Copilot',
  'general.protection_validate': 'Protection Validation',
  'general.error_budget': 'EB',
} as const;

type TranslationKey = keyof typeof tr;
type Translations = typeof tr;

// Mevcut dil (şimdilik sabit, ileride context'ten gelecek)
const currentLocale: Locale = 'tr';

const translations: Record<Locale, Translations> = { tr, en };

/**
 * Çeviri fonksiyonu
 * @param key - Çeviri anahtarı
 * @param params - Değiştirilecek parametreler
 * @returns Çevrilmiş metin
 */
export const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
  const translation = translations[currentLocale][key] || translations.en[key] || key;
  
  if (!params) return translation;
  
  return Object.entries(params).reduce((result, [param, value]) => {
    return result.replace(`{${param}}`, String(value));
  }, translation);
};

/**
 * Mevcut dili döndürür
 */
export const getCurrentLocale = (): Locale => currentLocale;

/**
 * Dil değiştirme (şimdilik no-op, ileride context güncellemesi)
 */
export const setLocale = (locale: Locale): void => {
  // TODO: Context güncellemesi
  console.log(`Locale changed to: ${locale}`);
};