# Copilot V0 Smoke Test Runbook

## Evidence Üretimi (İlk Tool Çağrısı)

### Adım 1: Dev Server Kontrolü
```bash
# Port 3003'te çalışıyor mu?
Get-NetTCPConnection -LocalPort 3003
```

### Adım 2: Browser'da Test
1. **Web'i aç:** http://localhost:3003
2. **CopilotDock'u aç** (sağ panel)
3. **Prompt'u yaz:**
```
Sadece aşağıdaki formatta tek bir tool çağrısı üret:

```json
{"tool":"getRuntimeHealth","params":{}}
```

Başka açıklama yazma.
```

### Adım 3: Network Tab Kontrolü
- **DevTools → Network** aç
- **Filter:** `/api/copilot/chat`
- **Beklenen:**
  - Type: `text/event-stream`
  - Status: `200`
  - Events:
    - `event: token` (LLM response)
    - `event: tool_call` (tool execution başladı)
    - `event: tool_result` (tool execution tamamlandı)
    - `event: done`

### Adım 4: Evidence Dosyası Kontrolü
```powershell
# Evidence dosyası oluştu mu?
Get-ChildItem evidence/hello_tool_world_*.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# Format kontrolü
$evidence = Get-Content evidence/hello_tool_world_*.json | ConvertFrom-Json
$evidence | Format-List requestId, tool, toolParamsHash, toolResultHash, prevHash, auditHash, elapsedMs, sseEventCount, ok
```

**Beklenen Alanlar:**
- ✅ `requestId`: Dolu (örn: `req_1234567890_abc123`)
- ✅ `tool`: `"getRuntimeHealth"`
- ✅ `toolParamsHash`: 16 karakter hex hash
- ✅ `toolResultHash`: 16 karakter hex hash
- ✅ `prevHash`: İlk entry için boş olabilir, sonrakiler için dolu
- ✅ `auditHash`: 64 karakter hex hash
- ✅ `elapsedMs`: > 0 (örn: 150-500ms)
- ✅ `sseEventCount`: > 0 (örn: 5-10)
- ✅ `ok`: `true`

---

## Regression Matrix - Manuel Testler

### A) Tool-Call Limit (4 → 3)

**Prompt:**
```
Aşağıdaki JSON bloklarını art arda üret (4 adet). Her biri ayrı fenced block olsun:

1) {"tool":"getRuntimeHealth","params":{}}
2) {"tool":"getRuntimeHealth","params":{}}
3) {"tool":"getRuntimeHealth","params":{}}
4) {"tool":"getRuntimeHealth","params":{}}

Açıklama yazma.
```

**Beklenen:**
- Network tab: `event: tool_limit_exceeded` görünür
  ```json
  {
    "event": "tool_limit_exceeded",
    "total": 4,
    "max": 3,
    "message": "Tool call limit exceeded: 4 > 3. Only first 3 will be executed."
  }
  ```
- Sadece 3 tool execution görünür (`tool_call` + `tool_result` x 3)
- Evidence dosyasında: `sseEventCount` içinde `tool_limit_exceeded` event'i sayılır

**Kanıt:**
- Network tab screenshot
- Evidence dosyası: `sseEventCount` değeri

---

### B) Allowlist (Bilinmeyen Tool)

**Prompt:**
```
Sadece şu tool çağrısını üret:

```json
{"tool":"getRuntimeHealth2","params":{}}
```
```

**Beklenen:**
- Network tab: `event: tool_call` görünmez (tool registry'de yok)
- Veya `tool_result` içinde:
  ```json
  {
    "event": "tool_result",
    "success": false,
    "error": "Tool \"getRuntimeHealth2\" not found",
    "errorCode": "TOOL_NOT_FOUND"
  }
  ```
- Evidence dosyasında: `ok: false`, `errorCode: "TOOL_NOT_FOUND"`

**Kanıt:**
- Network tab: `tool_result` event'i `success: false`
- Evidence dosyası: `ok: false`, `errorCode` dolu

---

### C) Audit Chain (prevHash Bağlantısı)

**Adımlar:**
1. **İlk mesaj:** "Health durumunu getir"
2. **İkinci mesaj (aynı oturum):** "Health durumunu tekrar getir"

**Beklenen:**
- Her request kendi evidence dosyasını üretir
- Her evidence'de:
  - `prevHash`: İlk entry için boş/null, sonrakiler için önceki `auditHash`
  - `auditHash`: `prevHash | timestamp | actor | role | tool | paramsHash | resultHash` hash'i

**Kanıt:**
- İki evidence dosyası: `hello_tool_world_<ts1>.json`, `hello_tool_world_<ts2>.json`
- İkinci dosyada `prevHash` kontrolü:
  ```powershell
  $first = Get-Content evidence/hello_tool_world_<ts1>.json | ConvertFrom-Json
  $second = Get-Content evidence/hello_tool_world_<ts2>.json | ConvertFrom-Json
  # İkinci dosyanın prevHash'i birinci dosyanın auditHash'i ile eşleşmeli
  $second.prevHash -eq $first.auditHash
  ```

**Not:** Şu an her request kendi hash chain'ini oluşturuyor. Request'ler arası global chain için ayrı bir "global audit chain" tasarımı gerekir (opsiyonel, P1+).

---

### D) SSE Disconnect (Abort Handling)

**Adımlar:**
1. **Uzun cevap ürettir:**
   ```
   Health'i al ve ayrıntılı yorumla, adım adım yaz. Her adımı detaylı açıkla.
   ```
2. **Stream devam ederken:** Sekmeyi kapat (tab close)

**Beklenen:**
- Server abort görüyor
- In-flight fetch/tool iptal oluyor
- Takılı kalan worker/stream yok
- Son SSE event (eğer gönderilebildiyse):
  ```json
  {
    "event": "error",
    "error": "Client disconnected",
    "errorCode": "CLIENT_ABORT"
  }
  ```

**Kanıt:**
- Server log: Abort signal tetiklendi
- Network tab: Stream kesildi (incomplete)
- Evidence dosyası (eğer oluştuysa): `ok: false`, `errorCode: "CLIENT_ABORT"`

**Not:** Abort anında evidence export edilip edilmediği implementasyona bağlı. P1'de abort handling'i güçlendirmek için:
- Abort anında partial evidence export
- Abort event'i audit log'a yazılması

---

## API Key Yokken 401 (Semantik Düzeltme)

**Test:**
```powershell
# API key'i geçici olarak kaldır
$env:OPENAI_API_KEY_OLD = $env:OPENAI_API_KEY
$env:OPENAI_API_KEY = ""

# Request at
Invoke-WebRequest -Uri "http://localhost:3003/api/copilot/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"test"}' -UseBasicParsing

# Geri yükle
$env:OPENAI_API_KEY = $env:OPENAI_API_KEY_OLD
```

**Beklenen:**
- Status: `401 Unauthorized` (not 500)
- Response:
  ```json
  {
    "error": "OPENAI_API_KEY not configured"
  }
  ```

**Kanıt:**
- HTTP status: 401
- Response body: JSON error message

---

## Browser DevTools Notu

**SSE görünürlüğü için:**
- **Chrome/Edge:** DevTools → Network → Filter: `event-stream` → Click request → "EventStream" tab
- **Firefox:** DevTools → Network → Filter: `event-stream` → Click request → "Response" tab (SSE events görünür)

**Event akışı:**
- Her `data: {...}` satırı bir SSE event
- Event type: `event` field'ından (token, tool_call, tool_result, done, error)

**Debugging:**
- Event'leri console'a log etmek için: Network tab → Request → "EventStream" → Events listesi
- Veya CopilotDock component'inde `console.log` ekle (SSE parser'da)

---

## Özet Checklist

- [ ] **Evidence üretildi:** `evidence/hello_tool_world_*.json` dosyası var
- [ ] **Evidence format doğru:** requestId, hash'ler, elapsedMs, ok dolu
- [ ] **Tool-call limit:** 4 tool → 3'te kesildi, `tool_limit_exceeded` event görüldü
- [ ] **Allowlist:** Bilinmeyen tool çalışmadı, `ok: false` + `errorCode` dolu
- [ ] **Audit chain:** prevHash doğru bağlanıyor (request içinde)
- [ ] **SSE disconnect:** Abort tetiklendi, `CLIENT_ABORT` event görüldü (opsiyonel)
- [ ] **API key 401:** API key yokken 401 döndü (not 500)

**Tüm checklist ✅ ise:** "Hello MarketSnapshot" milestone'una geçilebilir.

