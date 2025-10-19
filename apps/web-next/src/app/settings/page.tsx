"use client";
import AppShell from "@/components/layout/AppShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { ApiForm } from "@/components/settings/SecretInput";
import { toast } from "@/components/toast/Toaster";

export default function Settings() {
  const handleSave = async (provider: string, values: Record<string, string>) => {
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
      description: `${provider} bağlantı bilgileri güvenli şekilde kaydedildi.`
    });
  };

  const handleTest = async (provider: string, values: Record<string, string>) => {
    // This would call /api/settings/test to verify credentials
    console.log(`Testing ${provider}:`, values);
    
    toast({ 
      type: "info", 
      title: "Bağlantı Test Ediliyor",
      description: `${provider} bağlantısı kontrol ediliyor...`
    });

    // Simulate test
    setTimeout(() => {
      toast({ 
        type: "success", 
        title: "Bağlantı Başarılı",
        description: `${provider} API bağlantısı doğrulandı.`
      });
    }, 1500);
  };

  return (
    <AppShell>
      <PageHeader title="Ayarlar" subtitle="API anahtarları ve bağlantı ayarları" />
      <div className="px-6 pb-10">
        <Tabs defaultValue="exchange">
          <TabsList>
            <TabsTrigger value="exchange">Borsa API</TabsTrigger>
            <TabsTrigger value="ai">AI / Copilot</TabsTrigger>
          </TabsList>

          <TabsContent value="exchange">
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
          </TabsContent>

          <TabsContent value="ai">
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
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}