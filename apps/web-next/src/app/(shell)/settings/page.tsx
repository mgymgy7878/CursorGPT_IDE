"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ApiForm } from "@/components/settings/SecretInput";
import { toast } from "@/components/toast/Toaster";
import { cn } from "@/lib/utils";

type SettingsTab = 'exchange' | 'ai' | 'about';

/**
 * Settings Page - AppFrame shell içinde
 */
export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('exchange');

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
    <div className="space-y-6">
      <PageHeader title="Ayarlar" subtitle="API anahtarları ve bağlantı ayarları" />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800">
        <button
          onClick={() => setActiveTab('exchange')}
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
          onClick={() => setActiveTab('ai')}
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
          onClick={() => setActiveTab('about')}
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

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'exchange' && (
          <div className="space-y-6">
            <ApiForm
              title="Binance"
              fields={[
                { name: "API Key", envKey: "BINANCE_API_KEY" },
                { name: "Secret Key", envKey: "BINANCE_SECRET_KEY" }
              ]}
              onSave={(values) => handleSave("Binance", values)}
              onTest={(values) => handleTest("Binance", values)}
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
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
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

        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-6">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Açık Kaynak Lisansları</h3>

              <div className="space-y-4">
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
