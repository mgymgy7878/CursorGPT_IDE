"use client";
import { useEffect, useState } from "react";
import type { Settings } from "@/lib/settings";

const Field = (p: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) => (
  <div className="space-y-2">
    <label className="text-sm text-muted">{p.label}</label>
    <input {...p} className="input" />
  </div>
);
const Switch = ({checked,onChange,label}:{checked:boolean,onChange:(v:boolean)=>void,label:string}) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} />
    <span className="text-sm">{label}</span>
  </label>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings").then(r=>r.json()).then(setSettings).finally(()=>setLoading(false));
  }, []);

  const save = async (patch: Partial<Settings>) => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    setSettings(json.settings);
  };

  if (loading) return <div className="p-6">Yükleniyor…</div>;

  const ai = settings.ai ?? {};
  const bin = settings.binance ?? {};
  const spot = bin.spot ?? {};
  const fut = bin.futures ?? {};

  return (
    <div className="container py-8 space-y-8">
      <h1 className="page-title">Ayarlar</h1>

      {/* AI */}
      <section className="panel">
        <div className="panel-header">AI Bağlantısı</div>
        <div className="panel-body grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted">Sağlayıcı</label>
              <select
                className="input"
                value={ai.provider ?? "OpenAI"}
                onChange={(e)=>save({ ai: { ...ai, provider: e.target.value as "OpenAI" | "Anthropic" | "Groq" | "OpenRouter" } })}
              >
                <option>OpenAI</option>
                <option>Anthropic</option>
                <option>Groq</option>
                <option>OpenRouter</option>
              </select>
            </div>
            <Field label="API Key" value={ai.apiKey ?? ""} onChange={(e)=>save({ ai: { ...ai, apiKey: e.target.value } })}/>
            <Field label="Base URL (opsiyonel)" value={ai.baseUrl ?? ""} onChange={(e)=>save({ ai: { ...ai, baseUrl: e.target.value } })}/>
            <Field label="Model (opsiyonel)" value={ai.model ?? ""} onChange={(e)=>save({ ai: { ...ai, model: e.target.value } })}/>
            <div className="flex space-x-2">
              <button className="btn btn-primary" onClick={()=>save({ ai })}>Kaydet</button>
              <button className="btn btn-secondary" onClick={async ()=>{
                try {
                  const res = await fetch("/api/ai/config/status");
                  const data = await res.json();
                  alert(`AI Bağlantı Testi: ${data.connected ? '✅ Başarılı' : '❌ Başarısız'}\nModel: ${data.model || 'Belirtilmemiş'}`);
                } catch (e) {
                  alert('❌ AI bağlantı testi başarısız');
                }
              }}>Test Et</button>
            </div>
          </div>
          <div className="muted-box">
            AI anahtarını kaydettikten sonra Strategy Lab içindeki sohbet bu yapılandırmayı kullanır.
          </div>
        </div>
      </section>

      {/* BINANCE */}
      <section className="panel">
        <div className="panel-header">Binance Bağlantısı</div>
        <div className="panel-body grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* SPOT */}
          <div className="panel soft">
            <div className="panel-header text-base">Spot</div>
            <div className="panel-body space-y-6">
              <Switch
                checked={!!spot.useTestnet}
                onChange={(v)=>save({ binance: { ...settings.binance, spot: { ...spot, useTestnet: v } } })}
                label="Testnet kullan"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-sm font-medium">Live</div>
                  <Field label="API Key" value={spot.live?.apiKey ?? ""} onChange={(e)=>save({ binance: { ...bin, spot: { ...spot, live: { ...spot.live, apiKey: e.target.value } } } })}/>
                  <Field label="API Secret" value={spot.live?.secret ?? ""} onChange={(e)=>save({ binance: { ...bin, spot: { ...spot, live: { ...spot.live, secret: e.target.value } } } })}/>
                </div>
                <div className="space-y-4">
                  <div className="text-sm font-medium">Testnet</div>
                  <Field label="API Key" value={spot.testnet?.apiKey ?? ""} onChange={(e)=>save({ binance: { ...bin, spot: { ...spot, testnet: { ...spot.testnet, apiKey: e.target.value } } } })}/>
                  <Field label="API Secret" value={spot.testnet?.secret ?? ""} onChange={(e)=>save({ binance: { ...bin, spot: { ...spot, testnet: { ...spot.testnet, secret: e.target.value } } } })}/>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="btn btn-primary" onClick={()=>save({ binance: { ...bin, spot } })}>Kaydet (Spot)</button>
                <button className="btn btn-secondary" onClick={async ()=>{
                  try {
                    const res = await fetch("/api/exchange/connect", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "spot", testnet: spot.useTestnet })
                    });
                    const data = await res.json();
                    alert(`Spot Bağlantı Testi: ${data.connected ? '✅ Başarılı' : '❌ Başarısız'}\n${data.message || ''}`);
                  } catch (e) {
                    alert('❌ Spot bağlantı testi başarısız');
                  }
                }}>Test Et</button>
              </div>
            </div>
          </div>

          {/* FUTURES */}
          <div className="panel soft">
            <div className="panel-header text-base">Futures</div>
            <div className="panel-body space-y-6">
              <Switch
                checked={!!fut.useTestnet}
                onChange={(v)=>save({ binance: { ...bin, futures: { ...fut, useTestnet: v } } })}
                label="Testnet kullan"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-sm font-medium">Live</div>
                  <Field label="API Key" value={fut.live?.apiKey ?? ""} onChange={(e)=>save({ binance: { ...bin, futures: { ...fut, live: { ...fut.live, apiKey: e.target.value } } } })}/>
                  <Field label="API Secret" value={fut.live?.secret ?? ""} onChange={(e)=>save({ binance: { ...bin, futures: { ...fut, live: { ...fut.live, secret: e.target.value } } } })}/>
                </div>
                <div className="space-y-4">
                  <div className="text-sm font-medium">Testnet</div>
                  <Field label="API Key" value={fut.testnet?.apiKey ?? ""} onChange={(e)=>save({ binance: { ...bin, futures: { ...fut, testnet: { ...fut.testnet, apiKey: e.target.value } } } })}/>
                  <Field label="API Secret" value={fut.testnet?.secret ?? ""} onChange={(e)=>save({ binance: { ...bin, futures: { ...fut, testnet: { ...fut.testnet, secret: e.target.value } } } })}/>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="btn btn-primary" onClick={()=>save({ binance: { ...bin, futures: fut } })}>Kaydet (Futures)</button>
                <button className="btn btn-secondary" onClick={async ()=>{
                  try {
                    const res = await fetch("/api/exchange/connect", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "futures", testnet: fut.useTestnet })
                    });
                    const data = await res.json();
                    alert(`Futures Bağlantı Testi: ${data.connected ? '✅ Başarılı' : '❌ Başarısız'}\n${data.message || ''}`);
                  } catch (e) {
                    alert('❌ Futures bağlantı testi başarısız');
                  }
                }}>Test Et</button>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}