import { MarketData, MarketAnalysis, TechnicalIndicators } from "./MarketDataService"
import OpenAI from "openai"

export interface AIAnalysisResult {
  symbol: string
  technicalAnalysis: {
    summary: string
    signals: string[]
    strength: number
  }
  fundamentalAnalysis: {
    summary: string
    factors: string[]
    score: number
  }
  sentimentAnalysis: {
    summary: string
    sources: string[]
    score: number
  }
  macroeconomicAnalysis: {
    summary: string
    events: string[]
    impact: 'positive' | 'negative' | 'neutral'
  }
  correlationAnalysis: {
    relatedAssets: string[]
    correlationStrength: number
    diversification: string
  }
  aiRecommendation: {
    action: 'buy' | 'sell' | 'hold'
    confidence: number
    reasoning: string
    timeframe: 'short' | 'medium' | 'long'
    riskLevel: 'low' | 'medium' | 'high'
  }
  llmInsights: {
    question: string
    answer: string
    confidence: number
  }
}

export interface NewsItem {
  title: string
  content: string
  source: string
  timestamp: number
  sentiment: 'positive' | 'negative' | 'neutral'
  impact: 'high' | 'medium' | 'low'
}

export interface EconomicEvent {
  event: string
  date: string
  impact: 'positive' | 'negative' | 'neutral'
  description: string
}

class AIAnalysisService {
  private openai: OpenAI | null
  private newsCache: Map<string, NewsItem[]> = new Map()
  private economicEvents: EconomicEvent[] = []
  private isOpenAIEnabled: boolean = false

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (apiKey && apiKey.trim().length > 0) {
      this.openai = new OpenAI({ apiKey })
      this.isOpenAIEnabled = true
    } else {
      this.openai = null
      this.isOpenAIEnabled = false
      console.warn('AIAnalysisService: OPENAI_API_KEY bulunamadı, LLM içgörüleri devre dışı.')
    }
    this.initializeEconomicEvents()
  }

  private initializeEconomicEvents() {
    this.economicEvents = [
      {
        event: 'TCMB Faiz Kararı',
        date: '2024-01-25',
        impact: 'negative',
        description: 'Merkez Bankası faiz artışı bekleniyor'
      },
      {
        event: 'ABD FED Toplantısı',
        date: '2024-01-31',
        impact: 'neutral',
        description: 'FED faiz kararı açıklanacak'
      },
      {
        event: 'Enflasyon Verisi',
        date: '2024-02-05',
        impact: 'negative',
        description: 'TÜİK enflasyon verisi açıklanacak'
      }
    ]
  }

  // Ana AI analiz fonksiyonu
  async analyzeAsset(symbol: string, marketData: MarketData, technicalAnalysis: MarketAnalysis): Promise<AIAnalysisResult> {
    const [
      technicalAnalysisResult,
      fundamentalAnalysisResult,
      sentimentAnalysisResult,
      macroeconomicAnalysisResult,
      correlationAnalysisResult,
      llmInsights
    ] = await Promise.all([
      this.performTechnicalAnalysis(symbol, technicalAnalysis),
      this.performFundamentalAnalysis(symbol, marketData),
      this.performSentimentAnalysis(symbol),
      this.performMacroeconomicAnalysis(),
      this.performCorrelationAnalysis(symbol),
      this.getLLMInsights(symbol, marketData, technicalAnalysis)
    ])

    const aiRecommendation = await this.generateAIRecommendation({
      technical: technicalAnalysisResult,
      fundamental: fundamentalAnalysisResult,
      sentiment: sentimentAnalysisResult,
      macroeconomic: macroeconomicAnalysisResult,
      correlation: correlationAnalysisResult,
      llm: llmInsights
    })

    return {
      symbol,
      technicalAnalysis: technicalAnalysisResult,
      fundamentalAnalysis: fundamentalAnalysisResult,
      sentimentAnalysis: sentimentAnalysisResult,
      macroeconomicAnalysis: macroeconomicAnalysisResult,
      correlationAnalysis: correlationAnalysisResult,
      aiRecommendation,
      llmInsights
    }
  }

  // Teknik Analiz
  private async performTechnicalAnalysis(symbol: string, analysis: MarketAnalysis) {
    const { technical, sentiment, trend, recommendation, confidence } = analysis
    
    const signals = []
    if (technical.rsi > 70) signals.push('RSI aşırı alım bölgesinde')
    if (technical.rsi < 30) signals.push('RSI aşırı satım bölgesinde')
    if (technical.macd.value > technical.macd.signal) signals.push('MACD pozitif sinyal')
    if (technical.macd.value < technical.macd.signal) signals.push('MACD negatif sinyal')

    return {
      summary: `${symbol} teknik olarak ${sentiment} görünüyor. Trend ${trend} yönünde.`,
      signals,
      strength: confidence
    }
  }

  // Temel Analiz
  private async performFundamentalAnalysis(symbol: string, marketData: MarketData) {
    const factors = []
    let score = 0.5

    // Simüle edilmiş temel analiz
    if (symbol.includes('USDT')) {
      factors.push('Kripto para birimi - Yüksek volatilite')
      factors.push('24 saat işlem hacmi: ' + marketData.volume24h.toLocaleString())
      score = 0.6
    } else if (symbol.includes('THYAO')) {
      factors.push('Havacılık sektörü - Turizm sezonu etkisi')
      factors.push('Yüksek likidite')
      score = 0.7
    } else if (symbol.includes('GARAN')) {
      factors.push('Bankacılık sektörü - Faiz artışı etkisi')
      factors.push('Güçlü bilanço')
      score = 0.8
    }

    return {
      summary: `${symbol} temel analizi tamamlandı. ${factors.length} faktör değerlendirildi.`,
      factors,
      score
    }
  }

  // Sentiment Analizi
  private async performSentimentAnalysis(symbol: string) {
    // Simüle edilmiş haber ve sosyal medya analizi
    const sources = ['Twitter', 'Reddit', 'Finansal Haberler', 'Analist Raporları']
    const score = 0.5 + Math.random() * 0.4 - 0.2

    const newsItems = await this.getNewsForSymbol(symbol)
    const positiveNews = newsItems.filter(item => item.sentiment === 'positive').length
    const negativeNews = newsItems.filter(item => item.sentiment === 'negative').length

    let summary = `${symbol} için sentiment analizi tamamlandı. `
    if (positiveNews > negativeNews) {
      summary += 'Genel olarak pozitif sentiment.'
    } else if (negativeNews > positiveNews) {
      summary += 'Genel olarak negatif sentiment.'
    } else {
      summary += 'Nötr sentiment.'
    }

    return {
      summary,
      sources,
      score: Math.max(0, Math.min(1, score))
    }
  }

  // Makroekonomik Analiz
  private async performMacroeconomicAnalysis() {
    const upcomingEvents = this.economicEvents.filter(event => {
      const eventDate = new Date(event.date)
      const now = new Date()
      const diffTime = eventDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 30
    })

    const positiveEvents = upcomingEvents.filter(e => e.impact === 'positive').length
    const negativeEvents = upcomingEvents.filter(e => e.impact === 'negative').length

    let impact: 'positive' | 'negative' | 'neutral' = 'neutral'
    if (positiveEvents > negativeEvents) impact = 'positive'
    else if (negativeEvents > positiveEvents) impact = 'negative'

    return {
      summary: `Önümüzdeki 30 günde ${upcomingEvents.length} önemli ekonomik olay var.`,
      events: upcomingEvents.map(e => `${e.event} (${e.date})`),
      impact
    }
  }

  // Korelasyon Analizi
  private async performCorrelationAnalysis(symbol: string) {
    const relatedAssets = []
    let correlationStrength = 0.5

    if (symbol.includes('BTC')) {
      relatedAssets.push('ETHUSDT', 'BNBUSDT', 'SOLUSDT')
      correlationStrength = 0.8
    } else if (symbol.includes('THYAO')) {
      relatedAssets.push('PGSUS', 'DOAS', 'SASA')
      correlationStrength = 0.6
    } else if (symbol.includes('GARAN')) {
      relatedAssets.push('AKBNK', 'ISCTR', 'YKBNK')
      correlationStrength = 0.7
    }

    return {
      relatedAssets,
      correlationStrength,
      diversification: correlationStrength > 0.7 ? 'Düşük çeşitlendirme' : 'Yüksek çeşitlendirme'
    }
  }

  // LLM ile tahmin
  private async getLLMInsights(symbol: string, marketData: MarketData, technicalAnalysis: MarketAnalysis) {
    if (!this.isOpenAIEnabled || !this.openai) {
      return {
        question: `${symbol} 3 ay sonra ne olur?`,
        answer: 'AI analizi devre dışı veya API anahtarı yok',
        confidence: 0.3
      }
    }

    try {
      const prompt = `
        ${symbol} için piyasa analizi yap:
        
        Fiyat: ${marketData.price}
        24s Değişim: ${marketData.change24h}%
        RSI: ${technicalAnalysis.technical.rsi}
        Trend: ${technicalAnalysis.trend}
        Sentiment: ${technicalAnalysis.sentiment}
        
        Soru: Bu varlık 3 ay sonra düşer mi yükselir mi? Neden?
        
        Türkçe olarak kısa ve net cevap ver.
      `

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Sen bir finansal analistsin. Piyasa verilerini analiz ederek tahminler yapıyorsun.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200
      })

      return {
        question: `${symbol} 3 ay sonra ne olur?`,
        answer: completion.choices[0]?.message?.content || 'Analiz tamamlanamadı',
        confidence: 0.7
      }
    } catch (error) {
      console.error('LLM analiz hatası:', error)
      return {
        question: `${symbol} 3 ay sonra ne olur?`,
        answer: 'AI analizi şu anda kullanılamıyor',
        confidence: 0.3
      }
    }
  }

  // AI Önerisi Üretme
  private async generateAIRecommendation(analysis: {
    technical: any
    fundamental: any
    sentiment: any
    macroeconomic: any
    correlation: any
    llm: any
  }) {
    const { technical, fundamental, sentiment, macroeconomic, correlation, llm } = analysis

    // Puanlama sistemi
    let totalScore = 0
    let factors = []

    // Teknik analiz puanı
    totalScore += technical.strength * 0.3
    factors.push(`Teknik: ${(technical.strength * 100).toFixed(1)}%`)

    // Temel analiz puanı
    totalScore += fundamental.score * 0.2
    factors.push(`Temel: ${(fundamental.score * 100).toFixed(1)}%`)

    // Sentiment puanı
    totalScore += sentiment.score * 0.2
    factors.push(`Sentiment: ${(sentiment.score * 100).toFixed(1)}%`)

    // Makroekonomik etki
    if (macroeconomic.impact === 'positive') {
      totalScore += 0.1
      factors.push('Makro: Pozitif')
    } else if (macroeconomic.impact === 'negative') {
      totalScore -= 0.1
      factors.push('Makro: Negatif')
    }

    // LLM güven puanı
    totalScore += llm.confidence * 0.1
    factors.push(`AI: ${(llm.confidence * 100).toFixed(1)}%`)

    // Karar verme
    let action: 'buy' | 'sell' | 'hold' = 'hold'
    let confidence = Math.max(0, Math.min(1, totalScore))
    let timeframe: 'short' | 'medium' | 'long' = 'medium'
    let riskLevel: 'low' | 'medium' | 'high' = 'medium'

    if (totalScore > 0.6) {
      action = 'buy'
      if (totalScore > 0.8) {
        timeframe = 'short'
        riskLevel = 'low'
      }
    } else if (totalScore < 0.4) {
      action = 'sell'
      if (totalScore < 0.2) {
        timeframe = 'short'
        riskLevel = 'high'
      }
    }

    const reasoning = `${action.toUpperCase()} önerisi. Puanlar: ${factors.join(', ')}. Toplam: ${(totalScore * 100).toFixed(1)}%`

    return {
      action,
      confidence,
      reasoning,
      timeframe,
      riskLevel
    }
  }

  // Haber verilerini al
  private async getNewsForSymbol(symbol: string): Promise<NewsItem[]> {
    // Simüle edilmiş haber verileri
    const news = [
      {
        title: `${symbol} için pozitif haber`,
        content: 'Analistler pozitif görüş bildiriyor',
        source: 'Finansal Haberler',
        timestamp: Date.now() - 3600000,
        sentiment: 'positive' as const,
        impact: 'medium' as const
      },
      {
        title: `${symbol} hacim artışı`,
        content: 'İşlem hacmi yükseliyor',
        source: 'Piyasa Takip',
        timestamp: Date.now() - 7200000,
        sentiment: 'positive' as const,
        impact: 'low' as const
      }
    ]

    return news
  }

  // Çoklu zaman dilimi analizi
  async getMultiTimeframeAIAnalysis(symbol: string, marketData: MarketData, technicalAnalysis: MarketAnalysis) {
    const shortTerm = await this.analyzeAsset(symbol, marketData, technicalAnalysis)
    const mediumTerm = await this.analyzeAsset(symbol, marketData, technicalAnalysis)
    const longTerm = await this.analyzeAsset(symbol, marketData, technicalAnalysis)

    return {
      short: { ...shortTerm, timeframe: 'short' },
      medium: { ...mediumTerm, timeframe: 'medium' },
      long: { ...longTerm, timeframe: 'long' }
    }
  }
}

export default AIAnalysisService 