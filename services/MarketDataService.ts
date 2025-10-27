import axios from "axios"

export interface MarketData {
  symbol: string
  fullName: string
  price: number
  change24h: number
  changeValue: number
  volume24h: number
  marketCap?: number
  timestamp: number
  source: 'binance' | 'bist' | 'forex' | 'commodity'
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M'
}

export interface TechnicalIndicators {
  rsi: number
  macd: { value: number; signal: number; histogram: number }
  bollingerBands: { upper: number; middle: number; lower: number }
  movingAverages: { sma20: number; sma50: number; sma200: number }
  volume: number
  atr: number
}

export interface MarketAnalysis {
  symbol: string
  technical: TechnicalIndicators
  sentiment: 'bullish' | 'bearish' | 'neutral'
  trend: 'uptrend' | 'downtrend' | 'sideways'
  support: number
  resistance: number
  recommendation: 'buy' | 'sell' | 'hold'
  confidence: number
}

class MarketDataService {
  private dataCache: Map<string, MarketData> = new Map()
  private subscribers: Set<(data: MarketData) => void> = new Set()
  private updateInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeData()
    this.startDataUpdates()
  }

  private initializeData() {
    // Simüle edilmiş başlangıç verileri
    const initialData: MarketData[] = [
      {
        symbol: 'BTCUSDT',
        fullName: 'Bitcoin',
        price: 45000 + Math.random() * 5000,
        change24h: Math.random() * 10 - 5,
        changeValue: Math.random() * 2000 - 1000,
        volume24h: 2000000000 + Math.random() * 1000000000,
        marketCap: 850000000000,
        timestamp: Date.now(),
        source: 'binance',
        timeframe: '1m'
      },
      {
        symbol: 'ETHUSDT',
        fullName: 'Ethereum',
        price: 3000 + Math.random() * 500,
        change24h: Math.random() * 10 - 5,
        changeValue: Math.random() * 200 - 100,
        volume24h: 1500000000 + Math.random() * 500000000,
        marketCap: 350000000000,
        timestamp: Date.now(),
        source: 'binance',
        timeframe: '1m'
      },
      {
        symbol: 'BNBUSDT',
        fullName: 'Binance Coin',
        price: 300 + Math.random() * 50,
        change24h: Math.random() * 10 - 5,
        changeValue: Math.random() * 20 - 10,
        volume24h: 500000000 + Math.random() * 200000000,
        marketCap: 45000000000,
        timestamp: Date.now(),
        source: 'binance',
        timeframe: '1m'
      },
      {
        symbol: 'ADAUSDT',
        fullName: 'Cardano',
        price: 0.5 + Math.random() * 0.1,
        change24h: Math.random() * 10 - 5,
        changeValue: Math.random() * 0.05 - 0.025,
        volume24h: 200000000 + Math.random() * 100000000,
        marketCap: 15000000000,
        timestamp: Date.now(),
        source: 'binance',
        timeframe: '1m'
      },
      {
        symbol: 'SOLUSDT',
        fullName: 'Solana',
        price: 100 + Math.random() * 20,
        change24h: Math.random() * 10 - 5,
        changeValue: Math.random() * 10 - 5,
        volume24h: 300000000 + Math.random() * 150000000,
        marketCap: 40000000000,
        timestamp: Date.now(),
        source: 'binance',
        timeframe: '1m'
      },
      {
        symbol: 'THYAO',
        fullName: 'Türk Hava Yolları',
        price: 120 + Math.random() * 10,
        change24h: Math.random() * 5 - 2.5,
        changeValue: Math.random() * 5 - 2.5,
        volume24h: 50000000 + Math.random() * 25000000,
        timestamp: Date.now(),
        source: 'bist',
        timeframe: '1m'
      },
      {
        symbol: 'GARAN',
        fullName: 'Garanti Bankası',
        price: 25 + Math.random() * 5,
        change24h: Math.random() * 5 - 2.5,
        changeValue: Math.random() * 1 - 0.5,
        volume24h: 30000000 + Math.random() * 15000000,
        timestamp: Date.now(),
        source: 'bist',
        timeframe: '1m'
      },
      {
        symbol: 'AKBNK',
        fullName: 'Akbank',
        price: 30 + Math.random() * 5,
        change24h: Math.random() * 5 - 2.5,
        changeValue: Math.random() * 1 - 0.5,
        volume24h: 25000000 + Math.random() * 12500000,
        timestamp: Date.now(),
        source: 'bist',
        timeframe: '1m'
      }
    ]

    initialData.forEach(data => {
      this.dataCache.set(data.symbol, data)
    })
  }

  private startDataUpdates() {
    // Her 5 saniyede bir veri güncelle
    this.updateInterval = setInterval(() => {
      this.updateMarketData()
    }, 5000)
  }

  private updateMarketData() {
    this.dataCache.forEach((data, symbol) => {
      const priceChange = (Math.random() - 0.5) * 0.02 // ±%1 değişim
      const newPrice = data.price * (1 + priceChange)
      const newChange24h = data.change24h + (Math.random() - 0.5) * 0.5
      const newChangeValue = newPrice - data.price

      const updatedData: MarketData = {
        ...data,
        price: newPrice,
        change24h: newChange24h,
        changeValue: newChangeValue,
        volume24h: data.volume24h * (1 + (Math.random() - 0.5) * 0.1),
        timestamp: Date.now()
      }

      this.dataCache.set(symbol, updatedData)
      this.notifySubscribers(updatedData)
    })
  }

  private notifySubscribers(data: MarketData) {
    this.subscribers.forEach(callback => callback(data))
  }

  // Veri aboneliği
  subscribe(callback: (data: MarketData) => void) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  // Belirli sembol için veri al
  async getMarketData(symbol: string): Promise<MarketData | null> {
    return this.dataCache.get(symbol) || null
  }

  // Tüm verileri al
  async getAllMarketData(): Promise<MarketData[]> {
    return Array.from(this.dataCache.values())
  }

  // Teknik analiz hesapla
  async calculateTechnicalIndicators(symbol: string, timeframe: string = '1d'): Promise<TechnicalIndicators> {
    // Simüle edilmiş teknik analiz
    const data = this.dataCache.get(symbol)
    if (!data) {
      throw new Error(`Veri bulunamadı: ${symbol}`)
    }

    return {
      rsi: 50 + Math.random() * 40 - 20,
      macd: {
        value: Math.random() * 2 - 1,
        signal: Math.random() * 2 - 1,
        histogram: Math.random() * 2 - 1
      },
      bollingerBands: {
        upper: data.price * 1.02,
        middle: data.price,
        lower: data.price * 0.98
      },
      movingAverages: {
        sma20: data.price * (1 + Math.random() * 0.1 - 0.05),
        sma50: data.price * (1 + Math.random() * 0.1 - 0.05),
        sma200: data.price * (1 + Math.random() * 0.1 - 0.05)
      },
      volume: data.volume24h,
      atr: data.price * 0.02
    }
  }

  // Piyasa analizi yap
  async analyzeMarket(symbol: string): Promise<MarketAnalysis> {
    const data = await this.getMarketData(symbol)
    const technical = await this.calculateTechnicalIndicators(symbol)
    
    if (!data) {
      throw new Error(`Veri bulunamadı: ${symbol}`)
    }

    // Basit analiz algoritması
    const rsi = technical.rsi
    const macd = technical.macd.value
    const price = data.price
    const sma20 = technical.movingAverages.sma20

    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral'
    let trend: 'uptrend' | 'downtrend' | 'sideways' = 'sideways'
    let recommendation: 'buy' | 'sell' | 'hold' = 'hold'
    let confidence = 0.5

    // RSI analizi
    if (rsi > 70) {
      sentiment = 'bearish'
      recommendation = 'sell'
      confidence += 0.2
    } else if (rsi < 30) {
      sentiment = 'bullish'
      recommendation = 'buy'
      confidence += 0.2
    }

    // MACD analizi
    if (macd > 0 && price > sma20) {
      trend = 'uptrend'
      if (sentiment === 'bullish') confidence += 0.1
    } else if (macd < 0 && price < sma20) {
      trend = 'downtrend'
      if (sentiment === 'bearish') confidence += 0.1
    }

    return {
      symbol,
      technical,
      sentiment,
      trend,
      support: price * 0.95,
      resistance: price * 1.05,
      recommendation,
      confidence: Math.min(confidence, 1.0)
    }
  }

  // Çoklu zaman dilimi analizi
  async getMultiTimeframeAnalysis(symbol: string): Promise<{
    short: MarketAnalysis
    medium: MarketAnalysis
    long: MarketAnalysis
  }> {
    const short = await this.analyzeMarket(symbol)
    const medium = await this.analyzeMarket(symbol)
    const long = await this.analyzeMarket(symbol)

    return { short, medium, long }
  }

  // Servisi kapat
  disconnect() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }
}

export default MarketDataService 