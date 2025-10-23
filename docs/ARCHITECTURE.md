## ARCHITECTURE — İki Ajanlı Mimari
- **AI-1 (Operasyon/Süpervizör):** orkestrasyon, guardrails, canary, metrik eşikleri, Pause/Resume.
- **AI-2 (Strateji-Üretici):** NL→IR, backtest/optimizasyon, explain & fix önerileri.
- Monorepo: apps/web-next, services/*, packages/*; veri akışı WS→Provider→Store→UI; metrics → Prom/Grafana.
