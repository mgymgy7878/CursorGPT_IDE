"use client";
export const dynamic = "force-dynamic";

import { useTranslation } from "@/i18n/useTranslation";
import { ShieldCheck, AlertTriangle, TrendingDown } from "lucide-react";
import { toast } from "@/components/toast/Toaster";

export default function GuardrailsPage() {
  const t = useTranslation("common");

  const handleCreateTemplate = (templateType: 'daily-loss' | 'max-position') => {
    const templates = {
      'daily-loss': {
        name: 'Günlük Zarar Limiti',
        rule: 'Günlük toplam zarar %3\'ü geçerse tüm pozisyonları kapat',
      },
      'max-position': {
        name: 'Maksimum Pozisyon Büyüklüğü',
        rule: 'Tek işlem portföy değerinin %2\'sini geçemez',
      },
    };

    const template = templates[templateType];

    toast({
      type: 'success',
      title: 'Şablon Oluşturuldu (Mock)',
      description: `"${template.name}" kuralı eklendi. ${template.rule}`,
    });
  };

  return (
    <div className="px-6 py-4 min-h-screen bg-neutral-950 safe-bottom">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">{t("guardrails")}</h1>
        <p className="text-sm text-neutral-400">
          Risk yönetimi, koruma kuralları ve limit kontrolleri
        </p>
      </div>

      {/* Empty state with template CTAs */}
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldCheck className="size-16 mb-6 text-neutral-600" />
        <h3 className="text-xl font-medium mb-2 text-neutral-300">
          Henüz koruma kuralı yok
        </h3>
        <p className="text-sm text-neutral-400 mb-8 max-w-md leading-relaxed">
          Risk yönetimi kurallarınızı hızlı şablonlardan oluşturabilir veya özel kural tanımlayabilirsiniz
        </p>

        {/* Template CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          {/* Daily Loss Limit Template */}
          <button
            onClick={() => handleCreateTemplate('daily-loss')}
            className="group p-6 bg-card/40 border border-zinc-800 hover:border-amber-500/50 hover:bg-card/60 rounded-xl transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <TrendingDown className="size-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-200 mb-1">
                  Günlük Zarar Limiti
                </div>
                <div className="text-xs text-neutral-400 leading-relaxed">
                  Günlük toplam zarar %3'ü geçerse tüm pozisyonları otomatik kapat
                </div>
              </div>
            </div>
          </button>

          {/* Max Position Size Template */}
          <button
            onClick={() => handleCreateTemplate('max-position')}
            className="group p-6 bg-card/40 border border-zinc-800 hover:border-blue-500/50 hover:bg-card/60 rounded-xl transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <AlertTriangle className="size-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-200 mb-1">
                  Tek İşlem Max Risk
                </div>
                <div className="text-xs text-neutral-400 leading-relaxed">
                  Tek işlem portföy değerinin %2'sini geçemez, limiti aşarsa reddet
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Custom rule hint */}
        <div className="mt-6 text-xs text-neutral-500">
          İpucu: Özel kural tanımlamak için ayarlar bölümünden gelişmiş mod'u aktifleştirin
        </div>
      </div>
    </div>
  );
}
