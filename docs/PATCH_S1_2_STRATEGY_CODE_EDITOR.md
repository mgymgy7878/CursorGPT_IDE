# PATCH S1.2 – Strateji Kodu Tab'ına Gerçek Editor

**Tarih:** 2025-01-15
**Durum:** 📋 Planlandı
**Epic:** Shell v2 – Risk-First UI
**Sprint:** S1.2

---

## 🎯 PATCH Amacı

Strategy Lab Backtest sekmesindeki "Strateji Kodu" tab'ına gerçek bir code editor (Monaco Editor) eklemek. Böylece "burası IDE" hissi hemen verilecek ve Figma tasarımına bir adım daha yaklaşılacak.

**Hedef:** BacktestTab içinde `activeInnerTab === 'code'` iken Monaco Editor görünsün, syntax highlighting olsun, local state ile çalışsın.

---

## 📋 Görevler

### 1. Monaco Editor Import ve Setup

**Dosya:** `apps/web-next/src/app/strategy-lab/_tabs/BacktestTab.tsx`

- Monaco Editor'ü dynamic import ile ekle (SSR false)
- `@monaco-editor/react` zaten package.json'da mevcut
- Editor component'ini BacktestTab içinde kullan

### 2. Code State Yönetimi

- `useState` ile code state'i yönet
- Varsayılan template strateji kodu:
  ```typescript
  // Strategy Template
  export const config = {
    indicators: {
      emaFast: 20,
      emaSlow: 50,
      atr: 14
    },
    entry: {
      type: 'crossUp',
      fast: 'EMA',
      slow: 'EMA'
    },
    exit: {
      atrMult: 2,
      takeProfitRR: 1.5
    },
    feesBps: 5,
    slippageBps: 1
  };

  function onTick(data: TickData) {
    // Strategy logic here
  }
  ```

### 3. Editor UI Entegrasyonu

- `activeInnerTab === 'code'` iken Monaco Editor göster
- Editor'ü kart içinde göster (mevcut placeholder kart stilini koru)
- Editor yüksekliği: `h-[500px]` veya `h-[600px]`
- Language: `typescript`
- Theme: `vs-dark` veya proje temasına uygun

### 4. Stil Uyumu

- Editor'ü mevcut kart stiline uygun göster
- `rounded-xl border border-neutral-800 bg-neutral-900/70` gibi mevcut stil pattern'lerini kullan
- Editor içinde padding ve border'ları ayarla

---

## ✅ Başarı Kriterleri

- [ ] Monaco Editor "Strateji Kodu" tab'ında görünüyor
- [ ] Syntax highlighting çalışıyor (TypeScript)
- [ ] Kod düzenlenebiliyor (local state)
- [ ] Editor görsel olarak mevcut kartlarla uyumlu
- [ ] Typecheck ve lint temiz

---

## 📝 Notlar

- **Henüz DB'ye kaydetme yok:** Bu patch sadece UI seviyesinde editor ekliyor
- **Local state:** Kod sadece component state'inde tutuluyor
- **Sonraki adımlar:** DB entegrasyonu, kaydetme, yükleme ayrı patch'lerde gelecek
- **Monaco Editor:** Zaten projede mevcut (`@monaco-editor/react`)

---

## İlgili Dosyalar

- `apps/web-next/src/app/strategy-lab/_tabs/BacktestTab.tsx` - Ana tab component
- `apps/web-next/src/components/studio/CodeEditor.tsx` - Mevcut basit editor (referans)
- `apps/web-next/src/app/(app)/lab/page.tsx` - Monaco Editor kullanım örneği

