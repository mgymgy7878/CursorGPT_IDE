"use client";
import useSWR from "swr";
import { useState } from "react";
import type { Settings, ExchangeKeys, ThemeMode, Language } from "@/types/settings";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function SettingsPage() {
  const { data, mutate, isLoading } = useSWR<Settings>("/api/settings", fetcher);
  const [saving, setSaving] = useState(false);

  async function save(partial: Partial<Settings>) {
    setSaving(true);
    await fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(partial) });
    await mutate();
    setSaving(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ayarlar</h1>
          <p className="text-sm opacity-70">Tema, dil, borsa/AI anahtarları.</p>
        </div>
        <span className="text-xs text-gray-500">{data?.updatedAt && new Date(data.updatedAt).toLocaleString()}</span>
      </div>

      {/* Tercihler */}
      <section className="rounded-2xl border bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold">Tercihler</h2>
        <div className="flex flex-wrap gap-3">
          <Select
            label="Tema"
            value={data?.theme ?? "light"}
            onChange={(v) => save({ theme: v as ThemeMode })}
            options={[{v:"light",t:"Açık"},{v:"dark",t:"Koyu"}]}
          />
          <Select
            label="Dil"
            value={data?.language ?? "tr"}
            onChange={(v) => save({ language: v as Language })}
            options={[{v:"tr",t:"Türkçe"},{v:"en",t:"English"}]}
          />
        </div>
      </section>

      {/* Borsa Anahtarları */}
      <ExchangeCard
        title="Binance"
        initial={data?.exchanges?.binance}
        testPath="/api/exchange/binance/test"
        onSave={(k) => save({ exchanges: { ...data?.exchanges, binance: k } })}
      />
      <ExchangeCard
        title="BTCTurk"
        initial={data?.exchanges?.btcturk}
        testPath="/api/exchange/btcturk/test"
        onSave={(k) => save({ exchanges: { ...data?.exchanges, btcturk: k } })}
      />

      {/* AI Key */}
      <section className="rounded-2xl border bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold">AI</h2>
        <ApiKeyRow
          label="OpenAI API Key"
          placeholder="sk-..."
          initial={data?.ai?.openaiKey ?? ""}
          onSave={(key) => save({ ai: { openaiKey: key } })}
        />
      </section>

      {isLoading || saving ? <div className="text-sm text-gray-500">Kaydediliyor...</div> : null}
    </div>
  );
}

function Select({
  label, value, onChange, options,
}: { label:string; value:string; onChange:(v:string)=>void; options:{v:string;t:string}[] }) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      <select
        className="rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
      </select>
    </label>
  );
}

function ApiKeyRow({
  label, placeholder, initial, onSave,
}: { label:string; placeholder:string; initial:string; onSave:(key:string)=>void }) {
  const [v, setV] = useState(initial);
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm">
        <div className="mb-1 text-gray-600">{label}</div>
        <input
          type={show ? "text" : "password"}
          className="w-full rounded-xl border px-3 py-2 font-mono"
          placeholder={placeholder}
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <button onClick={() => setShow(!show)} className="rounded-xl border px-3 py-2">
          {show ? "Gizle" : "Göster"}
        </button>
        <button onClick={() => onSave(v)} className="rounded-xl border bg-gray-900 text-white px-3 py-2">
          Kaydet
        </button>
      </div>
    </div>
  );
}

function ExchangeCard({
  title, initial, testPath, onSave,
}: {
  title: string;
  initial?: ExchangeKeys;
  testPath: string;
  onSave: (k: ExchangeKeys) => void;
}) {
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? "");
  const [secret, setSecret] = useState(initial?.secret ?? "");
  const [testing, setTesting] = useState<null | "ok" | "fail">(null);

  async function test() {
    setTesting(null);
    const r = await fetch(testPath, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey, secret }),
    });
    setTesting(r.ok ? "ok" : "fail");
  }

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title} API Anahtarları</h2>
        <span className={`text-xs ${testing==="ok"?"text-green-600":testing==="fail"?"text-red-600":"text-gray-400"}`}>
          {testing==="ok" ? "✓ Bağlantı başarılı" : testing==="fail" ? "× Bağlantı başarısız" : "—"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-gray-600">API Key</div>
          <input
            className="w-full rounded-xl border px-3 py-2 font-mono"
            value={apiKey} onChange={(e)=>setApiKey(e.target.value)} placeholder="..." />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Secret</div>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2 font-mono"
            value={secret} onChange={(e)=>setSecret(e.target.value)} placeholder="..." />
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={test} className="rounded-xl border px-3 py-2">Bağlantıyı Test Et</button>
        <button
          onClick={() => onSave({ apiKey, secret })}
          className="rounded-xl border bg-gray-900 text-white px-3 py-2"
        >
          Kaydet
        </button>
      </div>
    </section>
  );
}
