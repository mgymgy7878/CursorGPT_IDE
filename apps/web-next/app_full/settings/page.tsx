'use client';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { testBinanceConnection, testBtcturkConnection } from '@/lib/api/executor';
import { useSettings } from '@/stores/settingsStore';
import { setSecret, getSecret, clearSecret } from '@/lib/crypto/secureLocal';

async function pingExecutor(){ try{ const r = await fetch('/api/public/health'); return r.ok; } catch { return false; } }

export default function SettingsPage(){
  const { theme, setTheme, locale, setLocale, wsUrl, setWsUrl, load } = useSettings();
  const [pass, setPass] = useState('');
  const [binKey, setBinKey] = useState('');
  const [binSec, setBinSec] = useState('');
  const [oaKey,  setOaKey ] = useState('');
  const [status, setStatus] = useState<null|string>(null);

  useEffect(()=>{ load(); }, [load]);

  const saveSecrets = async () => {
    if(!pass) return setStatus('Lütfen bir parola girin (yalnız bu oturum için).');
    await setSecret('binanceApiKey',    binKey, pass);
    await setSecret('binanceApiSecret', binSec, pass);
    await setSecret('openaiApiKey',     oaKey,  pass);
    setStatus('Anahtarlar şifrelendi ve kaydedildi.');
    setBinKey(''); setBinSec(''); setOaKey('');
  };
  const loadSecrets = async () => {
    if(!pass) return setStatus('Parola gerekiyor.');
    const a = await getSecret('binanceApiKey', pass);
    const s = await getSecret('binanceApiSecret', pass);
    const o = await getSecret('openaiApiKey', pass);
    setBinKey(a ?? ''); setBinSec(s ?? ''); setOaKey(o ?? '');
    setStatus('Anahtarlar çözüldü (alanlara yüklendi).');
  };
  const clearAll = () => {
    ['binanceApiKey','binanceApiSecret','openaiApiKey'].forEach(n => clearSecret(n as any));
    setStatus('Şifreli anahtarlar silindi.'); setBinKey(''); setBinSec(''); setOaKey('');
  };
  const testConn = async () => {
    setStatus('Bağlantı test ediliyor…');
    setStatus((await pingExecutor()) ? 'Executor HEALTH=OK' : 'Executor erişilemedi.');
  };

  const testBinance = async () => {
    setStatus('Binance testi başlatılıyor…');
    try {
      if(!pass) return setStatus('Parola gerekiyor.');
      const a = await getSecret('binanceApiKey', pass);
      const s = await getSecret('binanceApiSecret', pass);
      const r = await testBinanceConnection(a ?? '', s ?? '');
      setStatus(`Binance OK. drift=${r.timeDriftMs}ms sig=${r.signatureSample}`);
    } catch(e:any){ setStatus(`Binance HATA: ${e.message}`); }
  };

  const testBtcturk = async () => {
    setStatus('BTCTurk testi başlatılıyor…');
    try {
      if(!pass) return setStatus('Parola gerekiyor.');
      const a = await getSecret('btcturk_api_key', pass);
      const s = await getSecret('btcturk_api_secret', pass);
      const r = await testBtcturkConnection(a ?? '', s ?? '');
      setStatus(`BTCTurk OK. stamp=${r.stamp} sig=${r.signatureSample}`);
    } catch(e:any){ setStatus(`BTCTurk HATA: ${e.message}`); }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Ayarlar</h1>

      <section className="space-y-3 rounded-xl border p-4">
        <div className="font-medium">Genel</div>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-2">Tema
            <select value={theme} onChange={e=>setTheme(e.target.value as any)} className="rounded bg-zinc-800 px-2 py-1">
              <option value="dark">Koyu</option><option value="light">Açık</option>
            </select>
          </label>
          <label className="flex items-center gap-2">Dil
            <select value={locale} onChange={e=>setLocale(e.target.value as any)} className="rounded bg-zinc-800 px-2 py-1">
              <option value="tr">TR</option><option value="en">EN</option>
            </select>
          </label>
          <label className="flex items-center gap-2">WS URL
            <input value={wsUrl ?? ''} onChange={e=>setWsUrl(e.target.value)} className="rounded bg-zinc-800 px-2 py-1 w-[360px]" />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <div className="font-medium">Güvenlik</div>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="password" placeholder="Oturum parolası (yalnız bu sekme)" value={pass}
                 onChange={e=>setPass(e.target.value)} className="rounded bg-zinc-800 px-2 py-1 w-80"/>
          <button onClick={testConn} className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Executor Test</button>
          <button onClick={testBinance} className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Test Binance Connection</button>
          <button onClick={testBtcturk} className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Test BTCTurk Connection</button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <div className="font-medium">API Anahtarları</div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">Binance API Key
            <input value={binKey} onChange={e=>setBinKey(e.target.value)} className="mt-1 w-full rounded bg-zinc-800 px-2 py-1" />
          </label>
          <label className="text-sm">Binance Secret
            <input type="password" value={binSec} onChange={e=>setBinSec(e.target.value)} className="mt-1 w-full rounded bg-zinc-800 px-2 py-1" />
          </label>
          <label className="text-sm">OpenAI API Key
            <input type="password" value={oaKey} onChange={e=>setOaKey(e.target.value)} className="mt-1 w-full rounded bg-zinc-800 px-2 py-1" />
          </label>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={saveSecrets} className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Kaydet (Şifrele)</button>
          <button onClick={loadSecrets} className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Yükle (Çöz)</button>
          <button onClick={clearAll}    className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Sil</button>
        </div>
        {status && <div className="text-sm opacity-75">{status}</div>}
      </section>
    </div>
  );
}
