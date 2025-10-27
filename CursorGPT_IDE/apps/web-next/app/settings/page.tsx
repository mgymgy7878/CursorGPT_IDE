"use client";
import { useState } from "react";

export default function Settings() {
  const [ai, setAi] = useState({ provider:"OpenAI", baseUrl:"https://api.openai.com/v1", apiKey:"" });
  const [bin, setBin] = useState({ env:"testnet", apiKey:"", apiSecret:"" });
  const [out, setOut] = useState("-");

  const saveAI = async ()=>{
    const r = await fetch("/api/ai/config/save", {method:"POST", body: JSON.stringify(ai)});
    setOut(await r.text());
  };
  const testBinance = async ()=>{
    const r = await fetch("/api/exchange/connect", {method:"POST", body: JSON.stringify({ ...bin, exchange:"binance-futures" })});
    setOut(await r.text());
  };

  return (
    <div className="h-[calc(100vh-var(--nav-h))] overflow-hidden p-4">
      <div className="max-w-7xl mx-auto h-full grid grid-rows-[auto_1fr] gap-4">
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <div className="min-h-0 overflow-auto grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="text-xl font-semibold mb-4">OpenAI</h3>
            <label className="label">Provider</label>
            <select value={ai.provider} onChange={e=>setAi({...ai, provider:e.target.value})} className="input">
              <option>OpenAI</option>
            </select>
            <div className="h-2"/>
            <label className="label">Base URL</label>
            <input value={ai.baseUrl} onChange={e=>setAi({...ai, baseUrl:e.target.value})} className="input"/>
            <div className="h-2"/>
            <label className="label">API Key</label>
            <input value={ai.apiKey} onChange={e=>setAi({...ai, apiKey:e.target.value})} placeholder="sk-..." className="input"/>
            <div className="h-3"/>
            <button onClick={saveAI} className="btn-primary">Kaydet & Test</button>
          </div>
          <div className="card p-4">
            <h3 className="text-xl font-semibold mb-4">Binance Futures</h3>
            <div className="flex gap-3 mb-2">
              <label className="label flex items-center gap-2">
                <input type="radio" checked={bin.env==="testnet"} onChange={()=>setBin({...bin, env:"testnet"})}/>
                Testnet
              </label>
              <label className="label flex items-center gap-2">
                <input type="radio" checked={bin.env==="live"} onChange={()=>setBin({...bin, env:"live"})}/>
                Live
              </label>
            </div>
            <label className="label">API Key</label>
            <input value={bin.apiKey} onChange={e=>setBin({...bin, apiKey:e.target.value})} className="input"/>
            <div className="h-2"/>
            <label className="label">API Secret</label>
            <input value={bin.apiSecret} onChange={e=>setBin({...bin, apiSecret:e.target.value})} className="input"/>
            <div className="h-3"/>
            <button onClick={testBinance} className="btn-primary">Kaydet & Test Et</button>
          </div>
        </div>
      </div>
      <div className="mt-6 card p-4">
        <pre className="whitespace-pre-wrap text-sm">{out}</pre>
      </div>
    </div>
  );
}