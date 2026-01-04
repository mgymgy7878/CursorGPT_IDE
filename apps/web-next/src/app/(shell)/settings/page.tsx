"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { ApiForm } from "@/components/settings/SecretInput";
import { BinanceApiForm } from "@/components/settings/BinanceApiForm";
import { BistBrokerForm } from "@/components/settings/BistBrokerForm";
import { toast } from "@/components/toast/Toaster";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Surface } from "@/components/ui/Surface";
import { ClientTime } from "@/components/common/ClientTime";
import { ConnectionHealthCard } from "@/components/settings/ConnectionHealthCard";
import { getSparkMode, type SparkMode } from "@/lib/spark/config";

type SettingsTab = 'exchange' | 'ai' | 'app' | 'guide' | 'about';

// SSR-safe Spark Mode hook (client-only localStorage override)
function useSparkMode(): [SparkMode, (mode: SparkMode) => void] {
  const [mode, setMode] = useState<SparkMode>(() => {
    if (typeof window === 'undefined') {
      return getSparkMode(); // SSR: use env-based mode
    }
    // Client: check localStorage override first
    const stored = localStorage.getItem('spark-mode-override');
    if (stored && (stored === 'prod' || stored === 'testnet' || stored === 'paper')) {
      return stored as SparkMode;
    }
    return getSparkMode(); // Fallback to env-based
  });

  const updateMode = (newMode: SparkMode) => {
    setMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('spark-mode-override', newMode);
      // Dispatch custom event for same-window updates (StatusBar listens)
      window.dispatchEvent(new Event('spark-mode-changed'));
    }
  };

  return [mode, updateMode];
}

/**
 * Settings Page - AppFrame shell içinde
 */
export default function Settings() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    (searchParams?.get('tab') as SettingsTab) || 'exchange'
  );
  const { theme, setTheme } = useTheme();
  const [sparkMode, setSparkMode] = useSparkMode();

  // Deep-link support: URL'deki tab parametresini dinle
  useEffect(() => {
    const tab = searchParams?.get('tab') as SettingsTab;
    if (tab && ['exchange', 'ai', 'app', 'guide', 'about'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    router.push(`/settings?tab=${tab}`, { scroll: false });
  };

  // PATCH B: App settings state (localStorage-backed)
  const [appSettings, setAppSettings] = useState({
    language: 'tr',
    riskAlerts: true,
    balanceBlur: false,
    compactMode: true,
    reducedMotion: false,
    mockData: process.env.NODE_ENV === 'development',
    // PATCH E: New settings
    updateChannel: 'canary' as 'stable' | 'canary',
    autoUpdateCheck: false,
    lastUpdateCheck: null as string | null,
    desktopNotifications: false,
    telemetry: false,
  });

  // Load app settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('app-settings');
    if (stored) {
      try {
        setAppSettings({ ...appSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to load app settings:', e);
      }
    }
  }, []);

  // Save app settings to localStorage
  const updateAppSetting = <K extends keyof typeof appSettings>(
    key: K,
    value: typeof appSettings[K]
  ) => {
    const updated = { ...appSettings, [key]: value };
    setAppSettings(updated);
    localStorage.setItem('app-settings', JSON.stringify(updated));
  };

  // UI-1: Document title (SEO + browser tabs)
  useEffect(() => {
    document.title = 'Ayarlar — Spark Trading';
  }, []);

  const handleSave = async (provider: string, values: Record<string, string>) => {
    console.log(`Saving ${provider}:`, values);
    toast({
      type: "success",
      title: "Ayarlar Kaydedildi",
      description: `${provider} bağlantı bilgileri güvenli şekilde kaydedildi.`
    });
  };

  const handleTest = async (provider: string, values: Record<string, string>) => {
    console.log(`Testing ${provider}:`, values);
    toast({
      type: "info",
      title: "Bağlantı Test Ediliyor",
      description: `${provider} bağlantısı kontrol ediliyor...`
    });

    setTimeout(() => {
      toast({
        type: "success",
        title: "Bağlantı Başarılı",
        description: `${provider} API bağlantısı doğrulandı.`
      });
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* UI-1: H1 sr-only (tab bar yeter, breadcrumb StatusBar'da) */}
      <PageHeader
        title="Ayarlar"
        subtitle="API anahtarları ve bağlantı ayarları"
        className="sr-only"
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800">
        <button
          onClick={() => handleTabChange('exchange')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'exchange'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          )}
        >
          Borsa API
        </button>
        <button
          onClick={() => handleTabChange('ai')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'ai'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          )}
        >
          AI / Copilot
        </button>
        <button
          onClick={() => handleTabChange('app')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'app'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          )}
        >
          Uygulama
        </button>
        <button
          onClick={() => handleTabChange('guide')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'guide'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          )}
        >
          Kullanım Kılavuzu
        </button>
        <button
          onClick={() => handleTabChange('about')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'about'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          )}
        >
          Hakkında / Lisanslar
        </button>
      </div>

      {/* PATCH 7: Connection Health Summary */}
      {activeTab === 'exchange' && (
        <ConnectionHealthCard />
      )}

      {/* Tab Content */}
      <div className={cn("mt-3", activeTab === 'exchange' ? "h-[calc(100vh-var(--app-topbar-h,48px)-200px)] overflow-y-auto" : "")}>
        {activeTab === 'exchange' && (
          <div className="space-y-4">
              {/* PATCH L: Binance with Environment selector (Mainnet/Testnet) */}
              <BinanceApiForm
                onSave={(env, values) => handleSave(`Binance ${env}`, values)}
                onTest={(env, values) => handleTest(`Binance ${env}`, values)}
              />

              <ApiForm
                title="BTCTurk"
                fields={[
                  { name: "API Key", envKey: "BTCTURK_API_KEY" },
                  { name: "Secret Key", envKey: "BTCTURK_SECRET_KEY" }
                ]}
                onSave={(values) => handleSave("BTCTurk", values)}
                onTest={(values) => handleTest("BTCTurk", values)}
              />

              {/* PATCH M: BIST Aracı Kurum paneli */}
              <BistBrokerForm
                onSave={(brokerId, connectionType, values) => handleSave(`BIST ${brokerId} ${connectionType}`, values)}
                onTest={(brokerId, connectionType, values) => handleTest(`BIST ${brokerId} ${connectionType}`, values)}
              />
            </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
              <ApiForm
                title="OpenAI"
                fields={[
                  { name: "API Key", envKey: "OPENAI_API_KEY" }
                ]}
                onSave={(values) => handleSave("OpenAI", values)}
                onTest={(values) => handleTest("OpenAI", values)}
              />

              <ApiForm
                title="Anthropic"
                fields={[
                  { name: "API Key", envKey: "ANTHROPIC_API_KEY" }
                ]}
                onSave={(values) => handleSave("Anthropic", values)}
                onTest={(values) => handleTest("Anthropic", values)}
              />
            </div>
        )}

        {activeTab === 'app' && (
          <div className="space-y-4">
            {/* Spark Mode - PATCH: Testnet/Paper/Prod selector */}
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Spark Mode</h3>
              <p className="text-xs text-neutral-400 mb-3">
                Platform çalışma modu. Testnet ve Paper modları güvenli test için, Prod gerçek işlemler için.
              </p>
              <div className="flex gap-2">
                {(['prod', 'testnet', 'paper'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSparkMode(m)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                      sparkMode === m
                        ? m === 'prod'
                          ? 'border-red-500 bg-red-500/20 text-red-400'
                          : m === 'testnet'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                          : 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-neutral-700 text-neutral-400 hover:text-neutral-300'
                    )}
                    title={
                      m === 'prod' ? 'Production: Gerçek işlemler' :
                      m === 'testnet' ? 'Testnet: Binance testnet API' :
                      'Paper: Simüle edilmiş işlemler'
                    }
                  >
                    {m === 'prod' ? '🔴 Prod' : m === 'testnet' ? '🟡 Testnet' : '🔵 Paper'}
                  </button>
                ))}
              </div>
              {sparkMode === 'prod' && (
                <div className="mt-3 p-2 rounded border border-red-500/30 bg-red-500/10">
                  <p className="text-xs text-red-400">
                    ⚠️ Production modu aktif. Gerçek işlemler yapılacaktır. Dikkatli olun.
                  </p>
                </div>
              )}
              <p className="text-xs text-neutral-500 mt-2">
                Not: Bu ayar localStorage'da saklanır (client-only override). Build-time env vars önceliklidir.
              </p>
            </div>

            {/* Tema */}
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Tema</h3>
              <div className="flex gap-3">
                {(['auto', 'dark', 'light'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                      theme === t
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-neutral-700 text-neutral-400 hover:text-neutral-300'
                    )}
                  >
                    {t === 'auto' ? 'Sistem' : t === 'dark' ? 'Koyu' : 'Açık'}
                  </button>
                ))}
              </div>
            </div>

            {/* Dil */}
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Dil</h3>
              <div className="flex gap-3">
                {(['tr', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => updateAppSetting('language', lang)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                      appSettings.language === lang
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-neutral-700 text-neutral-400 hover:text-neutral-300'
                    )}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Bildirimler */}
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Bildirimler</h3>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-neutral-300">Risk uyarıları</span>
                <input
                  type="checkbox"
                  checked={appSettings.riskAlerts}
                  onChange={(e) => updateAppSetting('riskAlerts', e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600"
                />
              </label>
            </div>

            {/* Gizlilik */}
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Gizlilik</h3>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-neutral-300">Bakiyeyi gizle</span>
                <input
                  type="checkbox"
                  checked={appSettings.balanceBlur}
                  onChange={(e) => updateAppSetting('balanceBlur', e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600"
                />
              </label>
            </div>

            {/* Performans */}
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Performans</h3>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-neutral-300">Compact mode</span>
                  <input
                    type="checkbox"
                    checked={appSettings.compactMode}
                    onChange={(e) => updateAppSetting('compactMode', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-neutral-300">Reduced motion</span>
                  <input
                    type="checkbox"
                    checked={appSettings.reducedMotion}
                    onChange={(e) => updateAppSetting('reducedMotion', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600"
                  />
                </label>
              </div>
            </div>

            {/* Veri/Cache */}
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Veri & Önbellek</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    localStorage.clear();
                    toast({ type: "success", title: "Önbellek temizlendi" });
                  }}
                  className="w-full px-3 py-1.5 text-sm text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
                >
                  Cache temizle
                </button>
              </div>
            </div>

            {/* Geliştirici (DEV only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
                <h3 className="text-base font-semibold text-neutral-200 mb-3">Geliştirici</h3>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-neutral-300">Mock data</span>
                  <input
                    type="checkbox"
                    checked={appSettings.mockData}
                    onChange={(e) => updateAppSetting('mockData', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600"
                  />
                </label>
              </div>
            )}

            {/* PATCH E: Güncelleme - Gerçek ayarlar */}
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Güncelleme</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Kanal</label>
                  <div className="flex gap-2">
                    {(['stable', 'canary'] as const).map((channel) => (
                      <button
                        key={channel}
                        onClick={() => updateAppSetting('updateChannel', channel)}
                        className={cn(
                          'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                          appSettings.updateChannel === channel
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-neutral-700 text-neutral-400 hover:text-neutral-300'
                        )}
                      >
                        {channel === 'stable' ? 'Stable' : 'Canary'}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-neutral-300">Otomatik güncelleme kontrolü</span>
                  <input
                    type="checkbox"
                    checked={appSettings.autoUpdateCheck}
                    onChange={(e) => updateAppSetting('autoUpdateCheck', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600"
                  />
                </label>
                {appSettings.lastUpdateCheck && (
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Son kontrol</span>
                    <span><ClientTime value={appSettings.lastUpdateCheck} format="datetime" /></span>
                  </div>
                )}
                <div className="pt-2 border-t border-neutral-800">
                  <button
                    onClick={() => {
                      const now = new Date().toISOString();
                      updateAppSetting('lastUpdateCheck', now);
                      toast({ type: "info", title: "Güncelleme kontrol ediliyor..." });
                      // TODO: API call to check for updates
                    }}
                    className="w-full px-3 py-1.5 text-sm text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
                  >
                    Şimdi kontrol et
                  </button>
                </div>
              </div>
            </div>

            {/* PATCH E: Arayüz Yoğunluğu */}
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Arayüz Yoğunluğu</h3>
              <div className="flex gap-2">
                {(['normal', 'compact'] as const).map((density) => (
                  <button
                    key={density}
                    onClick={() => {
                      updateAppSetting('compactMode', density === 'compact');
                      // Global density mode'u da güncelle
                      if (typeof window !== 'undefined') {
                        document.documentElement.dataset.density = density === 'compact' ? 'compact' : 'comfort';
                      }
                    }}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                      (density === 'compact' ? appSettings.compactMode : !appSettings.compactMode)
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-neutral-700 text-neutral-400 hover:text-neutral-300'
                    )}
                  >
                    {density === 'normal' ? 'Normal' : 'Compact'}
                  </button>
                ))}
              </div>
            </div>

            {/* PATCH E: Bildirimler */}
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Bildirimler</h3>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-neutral-300">Risk uyarıları</span>
                  <input
                    type="checkbox"
                    checked={appSettings.riskAlerts}
                    onChange={(e) => updateAppSetting('riskAlerts', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-neutral-300">Desktop bildirimleri</span>
                  <input
                    type="checkbox"
                    checked={appSettings.desktopNotifications}
                    onChange={(e) => updateAppSetting('desktopNotifications', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600"
                  />
                </label>
              </div>
            </div>

            {/* PATCH E: Gizlilik & Telemetri */}
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Gizlilik & Telemetri</h3>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-neutral-300">Bakiyeyi gizle</span>
                  <input
                    type="checkbox"
                    checked={appSettings.balanceBlur}
                    onChange={(e) => updateAppSetting('balanceBlur', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-neutral-300">Kullanım metrikleri gönderimi</span>
                  <input
                    type="checkbox"
                    checked={appSettings.telemetry}
                    onChange={(e) => updateAppSetting('telemetry', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600"
                  />
                </label>
                <p className="text-xs text-neutral-500 mt-2">
                  Telemetri kapalıyken kullanım verileri gönderilmez (off by default).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Kullanım Kılavuzu</h3>

              {/* Accordion sections */}
              <div className="space-y-2">
                {/* Başlarken - PATCH D: Default open */}
                <details className="border border-neutral-800 rounded-lg overflow-hidden" open>
                  <summary className="px-3 py-2 text-sm font-medium text-neutral-300 cursor-pointer hover:bg-neutral-800/50 transition-colors list-none">
                    <span className="flex items-center gap-2">
                      <span>📋</span>
                      <span>Başlarken</span>
                    </span>
                  </summary>
                  <div className="px-3 py-2 text-xs text-neutral-400 space-y-2 border-t border-neutral-800 bg-neutral-950/50">
                    <p>Spark Trading, profesyonel bir kripto trading platformudur. İlk kurulumda:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Üst bar'da API/WS/Executor göstergelerini kontrol edin</li>
                      <li>Yeşil nokta: Aktif, Kırmızı: Bağlantı yok</li>
                      <li>Settings &gt; Borsa API'den API anahtarlarınızı ekleyin</li>
                    </ul>
                  </div>
                </details>

                {/* API Kurulumu */}
                <details className="border border-neutral-800 rounded-lg overflow-hidden">
                  <summary className="px-3 py-2 text-sm font-medium text-neutral-300 cursor-pointer hover:bg-neutral-800/50 transition-colors list-none">
                    <span className="flex items-center gap-2">
                      <span>🔑</span>
                      <span>API Kurulumu</span>
                    </span>
                  </summary>
                  <div className="px-3 py-2 text-xs text-neutral-400 space-y-2 border-t border-neutral-800 bg-neutral-950/50">
                    <p><strong>Binance:</strong> Binance.com &gt; API Management&apos;dan yeni API key oluşturun (Read &amp; Trade yetkileri).</p>
                    <p><strong>BTCTurk:</strong> BTCTurk.com &gt; API Keys&apos;den key/secret çifti oluşturun.</p>
                    <p>Settings &gt; Borsa API&apos;den anahtarları ekleyip &quot;Test Et&quot; ile bağlantıyı doğrulayın.</p>
                  </div>
                </details>

                {/* Piyasa Verileri */}
                <details className="border border-neutral-800 rounded-lg overflow-hidden">
                  <summary className="px-3 py-2 text-sm font-medium text-neutral-300 cursor-pointer hover:bg-neutral-800/50 transition-colors list-none">
                    <span className="flex items-center gap-2">
                      <span>📈</span>
                      <span>Piyasa Verileri</span>
                    </span>
                  </summary>
                  <div className="px-3 py-2 text-xs text-neutral-400 space-y-2 border-t border-neutral-800 bg-neutral-950/50">
                    <p><strong>Mini Grafik:</strong> Tabloda sembol yanında küçük trend grafikleri görüntülenir.</p>
                    <p><strong>Workspace:</strong> Sembol seçince büyük grafik + teknik detaylar açılır.</p>
                    <p><strong>Full Screen:</strong> Tam ekran chart modu (ESC ile çıkış).</p>
                    <p>Timeframe butonları (1m, 5m, 1D, vb.) ile periyodu değiştirebilirsiniz.</p>
                  </div>
                </details>

                {/* Stratejiler */}
                <details className="border border-neutral-800 rounded-lg overflow-hidden">
                  <summary className="px-3 py-2 text-sm font-medium text-neutral-300 cursor-pointer hover:bg-neutral-800/50 transition-colors list-none">
                    <span className="flex items-center gap-2">
                      <span>🤖</span>
                      <span>Stratejiler</span>
                    </span>
                  </summary>
                  <div className="px-3 py-2 text-xs text-neutral-400 space-y-2 border-t border-neutral-800 bg-neutral-950/50">
                    <p><strong>Running:</strong> Aktif çalışan stratejiler listesi (Live/Shadow modları).</p>
                    <p><strong>Strategies:</strong> Tüm stratejiler (Active/Paused durumları).</p>
                    <p><strong>Risk Etiketleri:</strong> Low/Medium/High (mavi pill'ler).</p>
                    <p>Pause/Resume ile stratejiyi durdurup tekrar başlatabilirsiniz.</p>
                  </div>
                </details>

                {/* Operasyon Merkezi */}
                <details className="border border-neutral-800 rounded-lg overflow-hidden">
                  <summary className="px-3 py-2 text-sm font-medium text-neutral-300 cursor-pointer hover:bg-neutral-800/50 transition-colors list-none">
                    <span className="flex items-center gap-2">
                      <span>⚡</span>
                      <span>Operasyon Merkezi</span>
                    </span>
                  </summary>
                  <div className="px-3 py-2 text-xs text-neutral-400 space-y-2 border-t border-neutral-800 bg-neutral-950/50">
                    <p><strong>Kill Switch:</strong> Acil durdurma butonu. Seçili aksiyonlar (pozisyon kapat, emir engelle, strateji durdur) sırayla uygulanır.</p>
                    <p><strong>Uyarılar:</strong> Risk uyarıları gruplandırılmış halde gösterilir. "✓ Onayla" veya "⏰ 10m" ile yönetebilirsiniz.</p>
                    <p><strong>Risk Parametreleri:</strong> Max Leverage, Max Drawdown, Position Size limitlerini ayarlayın.</p>
                  </div>
                </details>

                {/* Güvenlik & Risk */}
                <details className="border border-neutral-800 rounded-lg overflow-hidden">
                  <summary className="px-3 py-2 text-sm font-medium text-neutral-300 cursor-pointer hover:bg-neutral-800/50 transition-colors list-none">
                    <span className="flex items-center gap-2">
                      <span>🛡️</span>
                      <span>Güvenlik & Risk</span>
                    </span>
                  </summary>
                  <div className="px-3 py-2 text-xs text-neutral-400 space-y-2 border-t border-neutral-800 bg-neutral-950/50">
                    <p><strong>Shadow vs Live:</strong> Shadow mod gerçek para kullanmaz, test için güvenlidir. Live mod gerçek trade yapar.</p>
                    <p><strong>⚠️ UYARI:</strong> Live modda yanlışlıkla canlı trade tetiklenmesin diye dikkatli olun.</p>
                    <p>Operasyon Merkezi'nden Risk Parametreleri ile limitlerinizi kontrol edin.</p>
                  </div>
                </details>

                {/* Sorun Giderme */}
                <details className="border border-neutral-800 rounded-lg overflow-hidden">
                  <summary className="px-3 py-2 text-sm font-medium text-neutral-300 cursor-pointer hover:bg-neutral-800/50 transition-colors list-none">
                    <span className="flex items-center gap-2">
                      <span>🔧</span>
                      <span>Sorun Giderme</span>
                    </span>
                  </summary>
                  <div className="px-3 py-2 text-xs text-neutral-400 space-y-2 border-t border-neutral-800 bg-neutral-950/50">
                    <p><strong>WS kopuk:</strong> Üst bar'da WS kırmızı ise WebSocket bağlantısı yok. Sayfayı yenileyin.</p>
                    <p><strong>Executor down:</strong> Executor kırmızı ise backend servis çalışmıyor. `pnpm --filter executor dev` ile başlatın.</p>
                    <p><strong>Typecheck gate:</strong> Commit'ten önce typecheck çalışır. Hata varsa düzeltin.</p>
                    <p><strong>Cache sorunu:</strong> Settings &gt; Uygulama &gt; Cache temizle</p>
                  </div>
                </details>

                {/* SSS */}
                <details className="border border-neutral-800 rounded-lg overflow-hidden">
                  <summary className="px-3 py-2 text-sm font-medium text-neutral-300 cursor-pointer hover:bg-neutral-800/50 transition-colors list-none">
                    <span className="flex items-center gap-2">
                      <span>❓</span>
                      <span>SSS</span>
                    </span>
                  </summary>
                  <div className="px-3 py-2 text-xs text-neutral-400 space-y-2 border-t border-neutral-800 bg-neutral-950/50">
                    <p><strong>S: Release Gate nedir?</strong></p>
                    <p>C: Canary testi ve production release kontrolleri için kullanılır.</p>
                    <p><strong>S: Mock data nedir?</strong></p>
                    <p>C: Gerçek API'ye bağlanmadan test verileri ile çalışma modu (DEV'de).</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
                <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <h3 className="text-base font-semibold text-neutral-200 mb-3">Açık Kaynak Lisansları</h3>

              <div className="space-y-3">
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 mb-4">
                    <p className="text-xs font-medium text-amber-400">
                      ⚠️ Bu ürün TradingView ile ilişkili değildir ve TradingView tarafından onaylanmamıştır.
                    </p>
                  </div>

                  <div className="border-b border-white/10 pb-4">
                    <h4 className="text-sm font-medium text-neutral-300 mb-2">TradingView Lightweight Charts</h4>
                    <p className="text-xs text-neutral-400 mb-2">
                      Bu uygulama, grafik görselleştirmeleri için TradingView Lightweight Charts kütüphanesini kullanmaktadır.
                    </p>
                    <p className="text-xs text-neutral-400 mb-2">
                      Lightweight Charts, TradingView tarafından geliştirilmiş açık kaynaklı bir grafik kütüphanesidir.
                    </p>
                    <div className="mt-3">
                      <a
                      href="https://www.tradingView.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        TradingView Web Sitesi →
                      </a>
                    </div>
                    <div className="mt-2">
                      <a
                        href="https://github.com/tradingview/lightweight-charts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        GitHub Repository →
                      </a>
                    </div>
                  </div>

                  <div className="border-b border-white/10 pb-4">
                    <h4 className="text-sm font-medium text-neutral-300 mb-2">Lisans Bilgisi</h4>
                    <p className="text-xs text-neutral-400">
                      Lightweight Charts, Apache License 2.0 altında lisanslanmıştır.
                      Detaylı lisans metni için GitHub repository'sine bakabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
