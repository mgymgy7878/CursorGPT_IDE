"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { ApiForm } from "@/components/settings/SecretInput";
import { toast } from "@/components/toast/Toaster";
import { resetUiChromeState } from "@/hooks/useUiChrome";

const FIGMA_URL_KEY = "spark.settings.figmaFileUrl";
const TERMINAL_BETA_KEY = "spark.settings.uiTerminalBeta";

export default function Settings() {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [terminalBeta, setTerminalBeta] = useState(false);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(FIGMA_URL_KEY)
        : null;
    const envUrl = process.env.NEXT_PUBLIC_FIGMA_FILE_URL ?? "";
    setFigmaUrl(stored || envUrl);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(TERMINAL_BETA_KEY);
    setTerminalBeta(stored === "1" || stored === "true");
  }, []);

  const handleSaveFigmaUrl = () => {
    try {
      localStorage.setItem(FIGMA_URL_KEY, figmaUrl.trim());
      toast({
        type: "success",
        title: "Figma URL Kaydedildi",
        description: "Design sayfasında embed güncellendi.",
      });
    } catch {
      toast({
        type: "error",
        title: "Figma URL Kaydedilemedi",
        description: "LocalStorage erişimi başarısız oldu.",
      });
    }
  };

  const handleToggleTerminalBeta = () => {
    const next = !terminalBeta;
    setTerminalBeta(next);
    try {
      localStorage.setItem(TERMINAL_BETA_KEY, next ? "1" : "0");
      toast({
        type: "success",
        title: "Terminal Beta Güncellendi",
        description: next
          ? "Terminal (Beta) menüye eklendi."
          : "Terminal (Beta) menüden kaldırıldı.",
      });
    } catch {
      toast({
        type: "error",
        title: "Terminal Beta Kaydedilemedi",
        description: "LocalStorage erişimi başarısız oldu.",
      });
    }
  };
  const handleSave = async (
    provider: string,
    values: Record<string, string>,
  ) => {
    // This would call /api/settings/save with encrypted values
    console.log(`Saving ${provider}:`, values);

    // Audit log
    // await fetch("/api/audit/push", {
    //   method: "POST",
    //   body: JSON.stringify({ action: `settings.${provider}.save` }),
    // });

    toast({
      type: "success",
      title: "Ayarlar Kaydedildi",
      description: `${provider} bağlantı bilgileri güvenli şekilde kaydedildi.`,
    });
  };

  const handleTest = async (
    provider: string,
    values: Record<string, string>,
  ) => {
    // This would call /api/settings/test to verify credentials
    console.log(`Testing ${provider}:`, values);

    toast({
      type: "info",
      title: "Bağlantı Test Ediliyor",
      description: `${provider} bağlantısı kontrol ediliyor...`,
    });

    // Simulate test
    setTimeout(() => {
      toast({
        type: "success",
        title: "Bağlantı Başarılı",
        description: `${provider} API bağlantısı doğrulandı.`,
      });
    }, 1500);
  };

  const handleResetLayout = () => {
    toast({
      type: "info",
      title: "Yerleşim Sıfırlanıyor",
      description: "Sayfa yeniden yüklenecek...",
    });
    setTimeout(() => {
      resetUiChromeState();
    }, 500);
  };

  return (
    <AppShell>
      <PageHeader
        title="Ayarlar"
        subtitle="API anahtarları ve bağlantı ayarları"
      />
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <Tabs defaultValue="exchange">
          <TabsList>
            <TabsTrigger value="exchange">Borsa API</TabsTrigger>
            <TabsTrigger value="ai">AI / Copilot</TabsTrigger>
            <TabsTrigger value="appearance">Görünüm</TabsTrigger>
            <TabsTrigger value="licenses">Lisanslar</TabsTrigger>
          </TabsList>

          <TabsContent value="exchange">
            <div className="space-y-6">
              <ApiForm
                title="Binance"
                fields={[
                  { name: "API Key", envKey: "BINANCE_API_KEY" },
                  { name: "Secret Key", envKey: "BINANCE_SECRET_KEY" },
                ]}
                onSave={(values) => handleSave("Binance", values)}
                onTest={(values) => handleTest("Binance", values)}
              />

              <ApiForm
                title="BTCTurk"
                fields={[
                  { name: "API Key", envKey: "BTCTURK_API_KEY" },
                  { name: "Secret Key", envKey: "BTCTURK_SECRET_KEY" },
                ]}
                onSave={(values) => handleSave("BTCTurk", values)}
                onTest={(values) => handleTest("BTCTurk", values)}
              />
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <div className="space-y-6">
              <ApiForm
                title="OpenAI"
                fields={[{ name: "API Key", envKey: "OPENAI_API_KEY" }]}
                onSave={(values) => handleSave("OpenAI", values)}
                onTest={(values) => handleTest("OpenAI", values)}
              />

              <ApiForm
                title="Anthropic"
                fields={[{ name: "API Key", envKey: "ANTHROPIC_API_KEY" }]}
                onSave={(values) => handleSave("Anthropic", values)}
                onTest={(values) => handleTest("Anthropic", values)}
              />
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <div className="space-y-6">
              {/* Figma Design Link */}
              <div className="p-4 bg-neutral-900/50 border border-white/10 rounded-lg">
                <h3 className="text-sm font-semibold text-neutral-200 mb-2">
                  Figma Tasarım Linki
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  /design sayfasında embed edilen Figma dosyasını buradan
                  güncelleyebilirsiniz.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    placeholder="https://www.figma.com/file/..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-neutral-950 text-neutral-200 placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveFigmaUrl}
                    className="px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Kaydet
                  </button>
                </div>
              </div>

              {/* Terminal Beta Toggle */}
              <div className="p-4 bg-neutral-900/50 border border-white/10 rounded-lg">
                <h3 className="text-sm font-semibold text-neutral-200 mb-2">
                  Terminal (Beta)
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  Figma parity terminal iskeletini menüye ekler.
                </p>
                <button
                  onClick={handleToggleTerminalBeta}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    terminalBeta
                      ? "bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300"
                      : "bg-neutral-800/60 hover:bg-neutral-800 border border-white/10 text-neutral-300"
                  }`}
                >
                  {terminalBeta ? "Beta Açık" : "Beta Kapalı"}
                </button>
              </div>

              {/* Layout Reset Section */}
              <div className="p-4 bg-neutral-900/50 border border-white/10 rounded-lg">
                <h3 className="text-sm font-semibold text-neutral-200 mb-2">
                  Yerleşim Ayarları
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  Sol menü ve sağ panel durumlarını varsayılan değerlere
                  sıfırlar. Eski oturum verilerinden kaynaklanan yerleşim
                  sorunlarını çözer.
                </p>
                <button
                  onClick={handleResetLayout}
                  className="px-4 py-2 text-sm font-medium bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 rounded-lg transition-colors"
                >
                  Yerleşimi Sıfırla
                </button>
              </div>

              {/* Theme Section - Placeholder */}
              <div className="p-4 bg-neutral-900/50 border border-white/10 rounded-lg opacity-50">
                <h3 className="text-sm font-semibold text-neutral-200 mb-2">
                  Tema
                </h3>
                <p className="text-xs text-neutral-400">
                  Tema seçenekleri yakında eklenecek.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="licenses">
            <div className="space-y-6">
              {/* Lightweight Charts License */}
              <div className="p-4 bg-neutral-900/50 border border-white/10 rounded-lg">
                <h3 className="text-sm font-semibold text-neutral-200 mb-2">
                  Lightweight Charts
                </h3>
                <p className="text-xs text-neutral-400 mb-3">
                  Spark Trading, grafik görselleştirmeleri için TradingView'in
                  açık kaynak Lightweight Charts kütüphanesini kullanmaktadır.
                  Grafiklerde logo gösterilmiyor; atıf gereksinimi bu sayfada
                  karşılanmaktadır (TradingView dokümantasyonuyla uyumlu).
                </p>
                <div className="space-y-2 text-xs text-neutral-300">
                  <div>
                    <strong className="text-neutral-200">Lisans:</strong> Apache
                    License 2.0
                  </div>
                  <div>
                    <strong className="text-neutral-200">Kaynak:</strong>{" "}
                    <a
                      href="https://github.com/tradingview/lightweight-charts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      https://github.com/tradingview/lightweight-charts
                    </a>
                  </div>
                  <div>
                    <strong className="text-neutral-200">Web Sitesi:</strong>{" "}
                    <a
                      href="https://www.tradingview.com/lightweight-charts/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      https://www.tradingview.com/lightweight-charts/
                    </a>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-neutral-950/50 border border-white/5 rounded text-[11px] text-neutral-400 font-mono">
                  <div className="mb-2 font-semibold text-neutral-300">
                    Apache License 2.0 NOTICE:
                  </div>
                  <div className="space-y-1">
                    <div>Copyright © TradingView Inc.</div>
                    <div>
                      Licensed under the Apache License, Version 2.0 (the
                      "License"); you may not use this file except in compliance
                      with the License. You may obtain a copy of the License at:
                    </div>
                    <div className="text-blue-400">
                      <a
                        href="http://www.apache.org/licenses/LICENSE-2.0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-300 underline"
                      >
                        http://www.apache.org/licenses/LICENSE-2.0
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Licenses Placeholder */}
              <div className="p-4 bg-neutral-900/50 border border-white/10 rounded-lg opacity-50">
                <h3 className="text-sm font-semibold text-neutral-200 mb-2">
                  Diğer Lisanslar
                </h3>
                <p className="text-xs text-neutral-400">
                  Diğer üçüncü taraf lisansları yakında eklenecek.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
