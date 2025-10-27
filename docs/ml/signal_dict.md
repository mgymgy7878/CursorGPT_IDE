# ML Signal Dictionary - V2.0

## Overview
Bu doküman V2.0 ML Signal Fusion için tüm sinyallerin tanımlarını, formüllerini ve performans karakteristiklerini içerir.

## Signal Categories

### 1. Microstructure Signals

#### 1.1 Bid-Ask Spread Signal
- **Tanım**: Bid ve ask fiyatları arasındaki spread oranı
- **Formül**: `spread_ratio = (ask_price - bid_price) / mid_price`
- **P95 Scope**: 100ms
- **Latency Impact**: Low (basit aritmetik)
- **Leakage Risk**: None (sadece mevcut market data)
- **Confidence**: Spread sıkılığına göre (daha sıkı = daha yüksek güven)
- **Kullanım**: Market likiditesi ve spread genişliği analizi

#### 1.2 Order Imbalance Signal
- **Tanım**: Bid ve ask hacimleri arasındaki dengesizlik
- **Formül**: `imbalance_ratio = (bid_volume - ask_volume) / total_volume`
- **P95 Scope**: 200ms
- **Latency Impact**: Medium (hacim agregasyonu)
- **Leakage Risk**: None (sadece mevcut order book)
- **Confidence**: Toplam hacim büyüklüğüne göre
- **Kullanım**: Hacim dengesizliği ve fiyat baskısı analizi

#### 1.3 Price Roll Signal
- **Tanım**: Mevcut fiyat ile önceki fiyat arasındaki değişim
- **Formül**: `price_change_ratio = |current_price - previous_price| / previous_price`
- **P95 Scope**: 150ms
- **Latency Impact**: Low (fiyat karşılaştırması)
- **Leakage Risk**: None (mevcut vs önceki fiyat)
- **Confidence**: Fiyat değişim büyüklüğüne göre
- **Kullanım**: Fiyat momentumu ve trend analizi

### 2. Technical Analysis Signals

#### 2.1 RSI (Relative Strength Index) Signal
- **Tanım**: Fiyat momentumunun göreceli gücü
- **Formül**: `RSI = 100 - (100 / (1 + RS))` where `RS = avg_gain / avg_loss`
- **P95 Scope**: 50ms
- **Latency Impact**: Low (basit moving average)
- **Leakage Risk**: None (sadece geçmiş fiyat data)
- **Confidence**: RSI aşırı alım/satım seviyelerine göre
- **Kullanım**: Momentum ve aşırı alım/satım analizi

#### 2.2 MACD (Moving Average Convergence Divergence) Signal
- **Tanım**: İki farklı periyot EMA'sı arasındaki fark
- **Formül**: `MACD = EMA(12) - EMA(26)`, `Signal = EMA(9) of MACD`
- **P95 Scope**: 100ms
- **Latency Impact**: Medium (çoklu EMA)
- **Leakage Risk**: None (sadece geçmiş fiyat data)
- **Confidence**: Histogram büyüklüğüne göre
- **Kullanım**: Trend değişimi ve momentum analizi

#### 2.3 Bollinger Bands Signal
- **Tanım**: Fiyatın volatilite bantları içindeki pozisyonu
- **Formül**: `Upper = SMA + (2 * StdDev)`, `Lower = SMA - (2 * StdDev)`
- **P95 Scope**: 75ms
- **Latency Impact**: Medium (SMA + standart sapma)
- **Leakage Risk**: None (sadece geçmiş fiyat data)
- **Confidence**: Orta banttan uzaklığa göre
- **Kullanım**: Volatilite ve fiyat kanalları analizi

### 3. Flow Signals

#### 3.1 Volume Imbalance Signal
- **Tanım**: Alım ve satım hacimleri arasındaki dengesizlik
- **Formül**: `imbalance_ratio = (buy_volume - sell_volume) / total_volume`
- **P95 Scope**: 300ms
- **Latency Impact**: High (hacim agregasyonu)
- **Leakage Risk**: None (sadece mevcut hacim data)
- **Confidence**: Hacim büyüklüğü ve dengesizlik büyüklüğüne göre
- **Kullanım**: Hacim akışı ve fiyat baskısı analizi

#### 3.2 Latency-Aware Signal
- **Tanım**: Latency ve fiyat etkisi kombinasyonu
- **Formül**: `urgency = f(latency_ms, price_impact)`
- **P95 Scope**: 50ms
- **Latency Impact**: Low (latency ölçümü)
- **Leakage Risk**: None (sadece mevcut latency)
- **Confidence**: Latency stabilitesi ve fiyat etkisine göre
- **Kullanım**: Latency optimizasyonu ve aciliyet analizi

## Performance Characteristics

### Latency Impact Summary
- **Low Impact** (< 100ms): RSI, Bollinger Bands, Latency-Aware, Price Roll
- **Medium Impact** (100-200ms): MACD, Bid-Ask Spread
- **High Impact** (> 200ms): Order Imbalance, Volume Imbalance

### Leakage Risk Assessment
- **None**: Tüm sinyaller sadece mevcut veya geçmiş data kullanır
- **Point-in-time garantisi**: Gelecek data kullanılmaz
- **Validation**: Offline/online parity test ile doğrulanır

### P95 Scope Requirements
- **Microstructure**: 100-200ms
- **Technical**: 50-100ms
- **Flow**: 50-300ms
- **Total System**: < 500ms

## Signal Fusion Strategy

### Meta-Ensemble Approach
1. **Logistic Regression**: Temel sinyal ağırlıklandırması
2. **Decision Tree**: Non-linear pattern recognition
3. **Ensemble**: Stacking/boosting kombinasyonu

### Confidence Weighting
- Her sinyal kendi confidence skoru ile ağırlıklandırılır
- Ensemble confidence = weighted average of individual confidences
- Risk guardrails confidence eşiklerine göre tetiklenir

### A/B Testing Framework
- **Sim-only mode**: Gerçek trading olmadan test
- **Optimal score tracking**: Performans metrikleri
- **Risk guardrails**: %1 blok oranı hedefi

## Monitoring & Validation

### Parity Testing
- Offline vs online feature parity
- Leakage = 0 hedefi
- Point-in-time join garantisi

### Performance Metrics
- P95 latency compliance
- Signal accuracy tracking
- Risk guardrail effectiveness

### Alerting
- Latency threshold violations
- Signal confidence drops
- Risk guardrail triggers

## Future Enhancements

### Planned Signals
- **Sentiment Analysis**: News ve social media
- **Cross-Asset Correlation**: Portfolio-level signals
- **Regime Detection**: Market condition classification

### Architecture Improvements
- **Real-time Feature Store**: Redis/SQLite cache
- **Model Registry**: Versioning ve approval workflow
- **A/B Testing Platform**: Automated experimentation 