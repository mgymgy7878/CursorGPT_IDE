# Spark Dashboard - Dünya Standartları Araştırma Raporu

**Tarih:** 26.11.2025
**Hedef:** Bilgi yoğun, simetrik, scroll'suz dashboard tasarımı için en iyi uygulamalar
**Kapsam:** Trading platform dashboard'ları, grid sistemleri, Copilot entegrasyonları

---

## 1. Dünya Standartları Trading Platform Dashboard Analizi

### 1.1 Bloomberg Terminal (Altın Standart)

**Layout Yapısı:**
- **Multi-panel system:** 4-6 panel aynı anda görünür
- **Grid system:** 12-column base, her panel 2-4 kolon kaplar
- **Information density:** Çok yüksek (100+ metrik tek ekranda)
- **Scroll:** Panel içi scroll, sayfa scroll yok

**Özellikler:**
- **Market data:** Real-time ticker, depth, volume
- **Strategy positions:** Compact table (sembol, pozisyon, P&L, risk)
- **News feed:** Headline-only, 10-15 satır, scroll'lu
- **Risk metrics:** Top bar'da (VaR, exposure, leverage)

**Uygulanabilir Teknikler:**
```css
/* Bloomberg-style compact grid */
.bloomberg-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(6, minmax(80px, 1fr));
  gap: 4px; /* Çok sıkı gap */
}

.panel-market { grid-column: span 4; grid-row: span 2; }
.panel-strategy { grid-column: span 4; grid-row: span 3; }
.panel-news { grid-column: span 4; grid-row: span 2; }
.panel-risk { grid-column: span 12; grid-row: span 1; }
```

### 1.2 TradingView (Web-based)

**Layout Yapısı:**
- **Widget system:** Drag & drop widget'lar
- **Grid system:** Flexible grid (auto-fit, minmax)
- **Information density:** Orta-yüksek
- **Scroll:** Widget içi scroll, sayfa scroll minimal

**Özellikler:**
- **Market watchlist:** Compact list (sembol, fiyat, %)
- **Chart:** Dominant widget (60-70% ekran)
- **Strategy alerts:** Sidebar'da compact list
- **News:** Bottom bar'da ticker format

**Uygulanabilir Teknikler:**
```css
/* TradingView-style flexible grid */
.tradingview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 8px;
  container-type: inline-size;
}

.widget {
  min-height: 200px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}
```

### 1.3 MetaTrader 5 (Desktop)

**Layout Yapısı:**
- **Dock system:** Paneller dock'lanabilir
- **Grid system:** Fixed grid (4-6 kolon)
- **Information density:** Yüksek
- **Scroll:** Panel içi scroll

**Özellikler:**
- **Market Watch:** Compact table (sembol, bid/ask, spread)
- **Strategy positions:** Tab-based (open, pending, history)
- **News:** Bottom panel, headline-only
- **Terminal:** Log-based, compact font

**Uygulanabilir Teknikler:**
```css
/* MetaTrader-style dock system */
.mt5-dock {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.dock-panel {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--border);
}
```

### 1.4 QuantConnect (Algorithm Trading)

**Layout Yapısı:**
- **Split view:** Code editor + Dashboard
- **Grid system:** 2-column (editor 40%, dashboard 60%)
- **Information density:** Yüksek (backtest results, live metrics)
- **Scroll:** Dashboard içi scroll

**Özellikler:**
- **Strategy performance:** Compact metrics (Sharpe, P&L, drawdown)
- **Backtest results:** Table format (date, P&L, trades)
- **Live monitoring:** Real-time metrics bar
- **AI suggestions:** Sidebar'da action items

**Uygulanabilir Teknikler:**
```css
/* QuantConnect-style split view */
.quantconnect-layout {
  display: grid;
  grid-template-columns: 2fr 3fr;
  height: 100vh;
}

.dashboard-panel {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 8px;
}
```

---

## 2. Finansal Dashboard Veri Gösterim Teknikleri

### 2.1 Grid Sistemleri

**12-Column Grid (En Yaygın):**
```css
.dashboard-12col {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}

/* Örnek yerleşimler */
.strategies { grid-column: span 12; }        /* Full width */
.market { grid-column: span 7; }              /* ~58% */
.news { grid-column: span 5; }                /* ~42% */
.copilot { grid-column: span 3; }             /* ~25% */
```

**6-Column Grid (Daha Esnek):**
```css
.dashboard-6col {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

/* Örnek yerleşimler */
.strategies { grid-column: span 6; }         /* Full width */
.market { grid-column: span 4; }             /* ~67% */
.news { grid-column: span 2; }               /* ~33% */
```

**4-Column Grid (Kompakt):**
```css
.dashboard-4col {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

/* Örnek yerleşimler */
.strategies { grid-column: span 4; }         /* Full width */
.market { grid-column: span 3; }             /* 75% */
.news { grid-column: span 1; }               /* 25% */
```

### 2.2 Card Rasyo'ları (Golden Ratio)

**Önerilen Oranlar:**
- **1.618:1** (Golden Ratio) - En estetik
- **1.5:1** - Dengeli, yaygın kullanım
- **2:1** - Asimetrik, vurgu için
- **1:1** - Simetrik, eşit önem

**Uygulama:**
```css
/* Golden Ratio (1.618:1) */
.market-card { grid-column: span 8; }   /* 8/12 = 0.667 */
.news-card { grid-column: span 5; }     /* 5/12 = 0.417 */
/* 8:5 ≈ 1.6:1 */

/* Balanced (1.5:1) */
.market-card { grid-column: span 7; }  /* 7/12 = 0.583 */
.news-card { grid-column: span 5; }     /* 5/12 = 0.417 */
/* 7:5 = 1.4:1 ≈ 1.5:1 */
```

### 2.3 Mini-Chart Teknikleri

**Sparkline (Inline):**
```tsx
// Sadece trend gösterir, detay yok
<Sparkline data={[20, 25, 30, 28, 35]} width={60} height={20} />
```

**Mini Bar Chart:**
```tsx
// Volume veya P&L göstergesi
<MiniBarChart data={dailyPnL} width={80} height={30} />
```

**Heatmap:**
```tsx
// Çoklu sembol performansı
<Heatmap symbols={symbols} timeframe="24h" size="compact" />
```

### 2.4 Renk Kodlama

**Finansal Standartlar:**
- **Yeşil:** Pozitif P&L, yükseliş, long pozisyon
- **Kırmızı:** Negatif P&L, düşüş, short pozisyon
- **Sarı/Turuncu:** Uyarı, risk, dikkat gereken
- **Mavi:** Bilgi, nötr, referans
- **Gri:** Pasif, devre dışı, geçmiş veri

**Kontrast Oranları (WCAG AA):**
- **Normal metin:** 4.5:1 minimum
- **Büyük metin:** 3:1 minimum
- **Sayısal veri:** 4.5:1 (tabular-nums ile)

---

## 3. AI Copilot Entegrasyonu Örnekleri

### 3.1 Cursor IDE Copilot (Referans)

**Layout:**
- **Sabit genişlik:** 320-380px
- **Yükseklik:** Full-height (viewport'u doldurur)
- **Bölümler:**
  - Header: Context + sayısal özet
  - Content: Chat feed (scroll'lu)
  - Footer: Input + kısayollar

**Information Density:**
- **Context bar:** 2-3 satır (piyasa, strateji, portföy)
- **Sayısal özet:** 3 kolon (P&L, pozisyon, risk)
- **Chat feed:** Scroll'lu, compact messages
- **Input:** Single-line, expandable

**Action Suggestions:**
- **Quick commands:** 3-4 chip (BTC trend, ETH risk, P&L özet)
- **Context-aware:** Mevcut sayfa/veriye göre öneriler
- **Keyboard shortcuts:** Ctrl+K command palette

### 3.2 GitHub Copilot (Code Context)

**Layout:**
- **Inline suggestions:** Kod içinde
- **Chat panel:** Sağ sidebar (opsiyonel)
- **Information density:** Yüksek (code context + suggestions)

**Uygulanabilir Teknikler:**
```tsx
// Spark Copilot için benzer yapı
<CopilotPanel>
  <ContextBar>
    <MarketContext symbols={["BTCUSDT", "ETHUSDT"]} />
    <StrategyContext count={3} />
    <PortfolioContext pnl={233} />
  </ContextBar>

  <QuickActions>
    <ActionChip label="BTC 1h trend" />
    <ActionChip label="ETH risk" />
    <ActionChip label="P&L özetle" />
  </QuickActions>

  <ChatFeed items={messages} />
  <InputArea />
</CopilotPanel>
```

### 3.3 Trading Platform AI Assistants

**Örnekler:**
- **Capitalise.ai:** Strategy suggestions based on market conditions
- **QuantConnect:** Algorithm optimization suggestions
- **MetaTrader AI:** Trade signal analysis

**Ortak Özellikler:**
- **Real-time analysis:** Piyasa durumu analizi
- **Risk alerts:** Otomatik risk uyarıları
- **Action suggestions:** "Şu an yapılacaklar" listesi
- **Context awareness:** Mevcut pozisyonlara göre öneriler

---

## 4. Minimum Scroll, Maksimum Bilgi Görünürlüğü

### 4.1 Viewport-Based Height Calculation

**Teknik:**
```css
/* 1366×768 için optimize */
.dashboard-container {
  height: 100vh;
  max-height: 768px;
  overflow: hidden;
}

.card {
  max-height: calc(100vh - [header height] - [gap]);
  overflow-y: auto; /* Sadece kart içi scroll */
}
```

**Hesaplama:**
```
Viewport: 768px
- Topbar: 56px
- StatusBar: 32px
- Gap (üst): 12px
- Gap (alt): 12px
= Kalan: 656px

Kartlar:
- Strategies: 120-150px (flex-none)
- Market: ~250px (flex-1)
- News: ~250px (flex-1)
- Copilot: 656px (full-height, sağda)
```

### 4.2 Container Queries (Modern Yaklaşım)

**Teknik:**
```css
.dashboard-container {
  container-type: inline-size;
  container-name: dashboard;
}

@container dashboard (min-width: 1366px) {
  .strategies-card { max-height: 150px; }
  .market-card { max-height: calc(100vh - 200px); }
}

@container dashboard (max-width: 1365px) {
  .strategies-card { max-height: 120px; }
  .market-card { max-height: calc(100vh - 180px); }
}
```

### 4.3 Information Density Teknikleri

**1. Compact Typography:**
```css
.compact-text {
  font-size: 12px;
  line-height: 1.4;
  letter-spacing: -0.01em;
}
```

**2. Tabular Numbers:**
```css
.numeric {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
```

**3. Icon + Text Kombinasyonu:**
```tsx
// Uzun metin yerine icon + kısa metin
<Metric>
  <TrendingUp size={14} />
  <span>+2.34%</span>
</Metric>
```

**4. Abbreviation:**
```tsx
// Uzun değerler için kısaltma
{volume >= 1e9 ? `${(volume/1e9).toFixed(1)}B` : `${(volume/1e6).toFixed(1)}M`}
```

---

## 5. Önerilen Yerleşim Varyantları

### Varyant 1: Bloomberg-Style (4-Panel Grid)

```
┌─────────────────────────────────────────────────┐
│ Topbar (Status + Metrics)                       │
├──────────┬──────────────────────┬───────────────┤
│          │                      │               │
│ LeftNav  │  Strategies (full)   │  Copilot     │
│          │                      │  (340px)     │
│          ├──────────────────────┤               │
│          │  Market (1.5fr)      │               │
│          │  News (1fr)          │               │
│          │                      │               │
└──────────┴──────────────────────┴───────────────┘
```

**Grid:**
- LeftNav: 220px (sabit)
- Center: flex-1 (kalan)
- Copilot: 340px (sabit)
- Center içi: 12-column grid
  - Strategies: span 12
  - Market: span 7
  - News: span 5

### Varyant 2: TradingView-Style (Widget Grid)

```
┌─────────────────────────────────────────────────┐
│ Topbar                                          │
├──────────┬──────────────────────┬───────────────┤
│          │  Strategies          │  Copilot      │
│ LeftNav  │  (compact table)     │  (340px)     │
│          ├──────────────────────┤               │
│          │  Market (top movers)  │               │
│          │  News (headlines)    │               │
│          │                      │               │
└──────────┴──────────────────────┴───────────────┘
```

**Grid:**
- Auto-fit grid (minmax(300px, 1fr))
- Widget'lar responsive olarak yeniden düzenlenir
- Mobile'da tek kolon

### Varyant 3: QuantConnect-Style (Split View)

```
┌─────────────────────────────────────────────────┐
│ Topbar                                          │
├──────────┬──────────────────────┬───────────────┤
│          │  Strategies          │  Copilot      │
│ LeftNav  │  (metrics bar)       │  (340px)     │
│          │  Market + News       │               │
│          │  (split 60/40)       │               │
│          │                      │               │
└──────────┴──────────────────────┴───────────────┘
```

**Grid:**
- Center: 2-column (Market 60%, News 40%)
- Strategies: Full-width metrics bar
- Copilot: Full-height sidebar

---

## 6. Uygulanabilir Component Düzenleri

### 6.1 Strategy Card (Compact Table)

```tsx
// Bloomberg-style compact table
<StrategyTable>
  <StrategyRow>
    <StatusDot />
    <Name>Momentum BTC</Name>
    <Symbol>BTCUSDT</Symbol>
    <Position>Long 0.5 BTC</Position>
    <Entry>63.500 → 65.000</Entry>
    <PnL>+$245 (+3.8%)</PnL>
    <Risk>Low</Risk>
  </StrategyRow>
</StrategyTable>
```

**CSS:**
```css
.strategy-table {
  display: grid;
  grid-template-columns:
    auto minmax(120px, 1fr) minmax(80px, 0.8fr)
    minmax(100px, 1fr) minmax(80px, 0.8fr) minmax(100px, 1fr) auto;
  gap: 8px;
  font-size: 12px;
}
```

### 6.2 Market Card (Breadth + Top Movers)

```tsx
<MarketCard>
  <Header>
    <Title>Canlı Piyasa</Title>
    <Breadth>Crypto: 57↑ / 143↓ • Vol: 38B$</Breadth>
  </Header>
  <TopMovers>
    {movers.map(mover => (
      <MoverRow>
        <Symbol>{mover.symbol}</Symbol>
        <Price>{mover.price}</Price>
        <Change>{mover.change}%</Change>
        <Volume>Vol: {formatVolume(mover.volume)}</Volume>
      </MoverRow>
    ))}
  </TopMovers>
</MarketCard>
```

### 6.3 News Card (Headline Stream)

```tsx
<NewsCard>
  <Header>
    <Title>Haber Akışı</Title>
    <Badge>2</Badge>
  </Header>
  <NewsList>
    {news.map(item => (
      <NewsRow highlight={item.importance === 'high'}>
        <Badge>{item.importance}</Badge>
        <Title>{item.title}</Title>
        <Time>{item.timeAgo}</Time>
        <Source>{item.source}</Source>
      </NewsRow>
    ))}
  </NewsList>
</NewsCard>
```

### 6.4 Copilot Panel (Information + Actions)

```tsx
<CopilotPanel>
  <Header>
    <Title>Spark Copilot</Title>
    <Metrics>
      <Metric label="Günlük P&L" value="+$233" positive />
      <Metric label="Açık pozisyon" value="5" />
      <Metric label="Max risk" value="Orta" warning />
    </Metrics>
  </Header>
  <Context>
    <ContextItem>Piyasa: BTCUSDT, ETHUSDT</ContextItem>
    <ContextItem>Stratejiler: 3 aktif</ContextItem>
    <ContextItem>Portföy: Güncel</ContextItem>
  </Context>
  <QuickActions>
    <ActionChip>BTC 1h trend</ActionChip>
    <ActionChip>ETH risk</ActionChip>
    <ActionChip>P&L özetle</ActionChip>
  </QuickActions>
  <ChatFeed />
  <InputArea />
</CopilotPanel>
```

---

## 7. Önerilen Grid Sistemi (Spark için)

### 7.1 12-Column Grid (Önerilen)

```css
/* globals.css */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--gap, 12px);
  container-type: inline-size;
  container-name: dashboard;
}

/* Kullanım */
.strategies-card {
  grid-column: span 12;
  min-height: 120px;
  max-height: 150px;
}

.market-card {
  grid-column: span 7;  /* 7/12 = 58.3% */
}

.news-card {
  grid-column: span 5;  /* 5/12 = 41.7% */
}

/* 7:5 ≈ 1.4:1 (balanced ratio) */
```

### 7.2 Responsive Breakpoints

```css
/* Desktop (≥1024px) */
@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
}

/* Tablet (768px - 1023px) */
@media (max-width: 1023px) {
  .dashboard-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .strategies-card { grid-column: span 6; }
  .market-card { grid-column: span 4; }
  .news-card { grid-column: span 2; }
}

/* Mobile (<768px) */
@media (max-width: 767px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .strategies-card,
  .market-card,
  .news-card {
    grid-column: span 1;
  }
}
```

---

## 8. Copilot Analiz Özellikleri (Önerilen)

### 8.1 Strateji Analizi

**Sorular:**
- "En riskli pozisyon hangisi?"
- "Toplam P&L'yi analiz et"
- "Hangi strateji en çok kâr ediyor?"
- "Risk dağılımını göster"

**Çıktı:**
```tsx
<AnalysisResult>
  <Title>Strateji Analizi</Title>
  <Metric label="Toplam P&L" value="+$233" positive />
  <Metric label="En kârlı" value="Momentum BTC (+$245)" />
  <Metric label="En riskli" value="Mean Reversion ETH (High)" />
  <Action>Risk limitini gözden geçir</Action>
</AnalysisResult>
```

### 8.2 Piyasa Analizi

**Sorular:**
- "BTCUSDT için trend analizi yap"
- "En yüksek hacimli 3 coin hangisi?"
- "Piyasa risk-on mu risk-off mu?"

**Çıktı:**
```tsx
<AnalysisResult>
  <Title>Piyasa Analizi</Title>
  <Metric label="Market Regime" value="Risk-On" positive />
  <Metric label="Top Volume" value="BTCUSDT (1.2B$)" />
  <Metric label="Breadth" value="57↑ / 143↓" />
  <Action>Long pozisyonları artır</Action>
</AnalysisResult>
```

### 8.3 Risk Uyarıları (Otomatik)

**Trigger'lar:**
- Risk limiti %80'e yaklaştı
- 3+ strateji aynı anda zararda
- Piyasa volatilitesi arttı
- Açık pozisyon sayısı limit'e yaklaştı

**Gösterim:**
```tsx
<RiskAlert severity="warning">
  <Icon>⚠️</Icon>
  <Message>Risk limiti %78'e ulaştı</Message>
  <Action>Pozisyon boyutlarını azalt</Action>
</RiskAlert>
```

---

## 9. Sonuç ve Öneriler

### 9.1 Öncelikli Uygulamalar

1. **12-Column Grid System** ✅
   - Daha tutarlı oranlar
   - Responsive breakpoint'ler
   - Design system uyumu

2. **Container Queries** ✅
   - 1366×768 garantisi
   - Viewport-based height calculation
   - Scroll'suz overview

3. **Compact Table Format** ✅
   - Strategy: Card → Table row
   - Market: Breadth + Top movers
   - News: Headline stream

4. **Copilot Sayısal Özet** ✅
   - Günlük P&L, pozisyon, risk
   - Context awareness
   - Action suggestions

### 9.2 Gelecek İyileştirmeler

1. **Mini-charts:** Sparkline'lar, mini bar charts
2. **Heatmap:** Çoklu sembol performansı
3. **AI Analysis:** Otomatik risk uyarıları, trend analizi
4. **Keyboard Shortcuts:** Hızlı navigasyon, command palette

---

**Not:** Bu rapor, mevcut Spark dashboard yapısına uygun olarak hazırlanmıştır. Tüm öneriler, `docs/UI_UX_TALIMATLAR_VE_PLAN.md` ile uyumludur.

