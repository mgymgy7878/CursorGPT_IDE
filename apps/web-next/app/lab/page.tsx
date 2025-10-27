"use client";
import { useState } from "react";

export default function Lab() {
  const [code, setCode] = useState("// Buraya strateji kodunu yaz veya sağdaki AI'dan üret\n");

  return (
    <div className="lab-shell">
      {/* Üst butonlar */}
      <div className="lab-toolbar">
        <button className="btn">Backtest</button>
        <button className="btn">Optimize Et</button>
        <div style={{flex:1}} />
        <button className="btn btn-ghost">Kodu Kopyala</button>
        <button className="btn btn-primary">Kaydet</button>
      </div>

      {/* 3 Kolon Izgara */}
      <div className="lab-grid">
        {/* 1. kolon: Dosyalar */}
        <div className="lab-col">
          <div className="lab-panel panel">
            <div className="panel-header">Dosyalar</div>
            <div className="panel-body space-y-3">
              <div className="input">strategy.ts</div>
              <div className="input">params.json</div>
              <div className="input">notlar.md</div>

              <div className="mt-6 text-sm font-medium">Hızlı Şablonlar</div>
              <button className="btn w-full">EMA50/200 + ATR</button>
              <button className="btn w-full">RSI(14)</button>
            </div>
          </div>
        </div>

        {/* 2. kolon: Editör */}
        <div className="lab-col">
          <div className="lab-panel panel">
            <div className="panel-header">Strateji Editörü</div>
            <div className="panel-body editor-wrap">
              <textarea className="editor" value={code} onChange={e=>setCode(e.target.value)} />
              <div className="text-xs text-muted mt-2">İpucu: Agent'a <code>/backtest</code> veya <code>/optimize</code> ile komut ver.</div>
            </div>
          </div>
        </div>

        {/* 3. kolon: AI Agent */}
        <div className="lab-col">
          <div className="lab-panel panel">
            <div className="panel-header">AI Agent</div>
            <div className="panel-body flex flex-col gap-3">
              <div className="muted-box">AI çıktıları burada görünecek.</div>
              <div className="flex gap-2">
                <input className="input" placeholder="İsteğini yaz… (örn: EMA 34/89 ekle)"/>
                <button className="btn btn-primary">Gönder</button>
              </div>
              <div className="text-xs text-muted">Kullanılan AI: —</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}