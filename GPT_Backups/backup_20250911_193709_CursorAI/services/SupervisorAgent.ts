import MarketDataService from "./MarketDataService"
import AIAnalysisService from "./AIAnalysisService"
import StrategyEngine from "./StrategyEngine"
import PortfolioManager from "./PortfolioManager"
import { MarketData, MarketAnalysis } from "./MarketDataService"
import { AIAnalysisResult } from "./AIAnalysisService"
import { Strategy, StrategyRecommendation, Trade } from "./StrategyEngine"
import { Portfolio, RebalanceResult } from "./PortfolioManager"

export interface SupervisorReport {
  timestamp: Date
  marketSummary: {
    totalSymbols: number
    bullishCount: number
    bearishCount: number
    neutralCount: number
    topPerformers: string[]
    worstPerformers: string[]
  }
  portfolioStatus: {
    totalValue: number
    totalPnL: number
    totalPnLPercentage: number
    riskLevel: string
    rebalanceNeeded: boolean
  }
  strategyPerformance: {
    totalStrategies: number
    activeStrategies: number
    averageWinRate: number
    bestStrategy: string
    worstStrategy: string
  }
  aiRecommendations: {
    buySignals: string[]
    sellSignals: string[]
    holdSignals: string[]
    newStrategies: string[]
  }
  alerts: {
    high: string[]
    medium: string[]
    low: string[]
  }
  nextActions: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
}

export interface MarketAlert {
  id: string
  type: 'price_alert' | 'volume_alert' | 'technical_alert' | 'news_alert' | 'risk_alert'
  severity: 'high' | 'medium' | 'low'
  symbol: string
  message: string
  timestamp: Date
  acknowledged: boolean
}

export interface TradingSignal {
  id: string
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  confidence: number
  reasoning: string
  strategyId?: string
  timeframe: 'short' | 'medium' | 'long'
  riskLevel: 'low' | 'medium' | 'high'
  timestamp: Date
  executed: boolean
}

export interface AutoTradeConfig {
  enabled: boolean
  maxPositionSize: number // Portföyün maksimum %'si
  minConfidence: number // Minimum güven skoru
  maxDailyTrades: number // Günlük maksimum işlem sayısı
  riskManagement: {
    stopLoss: number // % cinsinden
    takeProfit: number // % cinsinden
    maxDrawdown: number // % cinsinden
  }
  allowedSymbols: string[] // İşlem yapılacak semboller
  tradingHours: {
    start: string // "09:00"
    end: string // "17:00"
  }
}

export interface AutoTradeResult {
  success: boolean
  tradeId?: string
  message: string
  timestamp: Date
}

class SupervisorAgent {
  private marketDataService: MarketDataService
  private aiAnalysisService: AIAnalysisService
  private strategyEngine: StrategyEngine
  private portfolioManager: PortfolioManager
  private alerts: Map<string, MarketAlert> = new Map()
  private signals: Map<string, TradingSignal> = new Map()
  private isRunning: boolean = false
  private checkInterval: NodeJS.Timeout | null = null
  private autoTradeConfig: AutoTradeConfig = {
    enabled: false,
    maxPositionSize: 0.05, // %5
    minConfidence: 0.75,
    maxDailyTrades: 10,
    riskManagement: {
      stopLoss: 0.02, // %2
      takeProfit: 0.05, // %5
      maxDrawdown: 0.10 // %10
    },
    allowedSymbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
    tradingHours: {
      start: "09:00",
      end: "17:00"
    }
  }
  private dailyTradeCount: number = 0
  private lastTradeDate: string = new Date().toDateString()

  constructor() {
    this.marketDataService = new MarketDataService()
    this.aiAnalysisService = new AIAnalysisService()
    this.strategyEngine = new StrategyEngine()
    this.portfolioManager = new PortfolioManager()
  }

  // Supervisor'ı başlat
  async start(): Promise<boolean> {
    if (this.isRunning) return true

    try {
      this.isRunning = true
      console.log('🤖 AI Supervisor Agent başlatıldı')

      // Her 5 dakikada bir kontrol
      this.checkInterval = setInterval(async () => {
        await this.performSupervision()
      }, 5 * 60 * 1000)

      // İlk kontrolü hemen yap
      await this.performSupervision()
      return true
    } catch (error) {
      console.error('Supervisor başlatma hatası:', error)
      this.isRunning = false
      return false
    }
  }

  // Supervisor'ı durdur
  async stop(): Promise<boolean> {
    if (!this.isRunning) return true

    try {
      this.isRunning = false
      if (this.checkInterval) {
        clearInterval(this.checkInterval)
        this.checkInterval = null
      }

      console.log('🤖 AI Supervisor Agent durduruldu')
      return true
    } catch (error) {
      console.error('Supervisor durdurma hatası:', error)
      return false
    }
  }

  // Otomatik işlem konfigürasyonu
  setAutoTradeConfig(config: Partial<AutoTradeConfig>): void {
    this.autoTradeConfig = { ...this.autoTradeConfig, ...config }
    console.log('🤖 Otomatik işlem konfigürasyonu güncellendi:', this.autoTradeConfig)
  }

  // Otomatik işlem konfigürasyonunu al
  getAutoTradeConfig(): AutoTradeConfig {
    return { ...this.autoTradeConfig }
  }

  // Otomatik işlem yap
  private async executeAutoTrade(signal: TradingSignal): Promise<AutoTradeResult> {
    // Günlük işlem sayısını kontrol et
    const today = new Date().toDateString()
    if (today !== this.lastTradeDate) {
      this.dailyTradeCount = 0
      this.lastTradeDate = today
    }

    if (this.dailyTradeCount >= this.autoTradeConfig.maxDailyTrades) {
      return {
        success: false,
        message: 'Günlük maksimum işlem sayısına ulaşıldı',
        timestamp: new Date()
      }
    }

    // Trading saatlerini kontrol et
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    if (currentTime < this.autoTradeConfig.tradingHours.start || 
        currentTime > this.autoTradeConfig.tradingHours.end) {
      return {
        success: false,
        message: 'Trading saatleri dışında',
        timestamp: new Date()
      }
    }

    // Sembol kontrolü
    if (!this.autoTradeConfig.allowedSymbols.includes(signal.symbol)) {
      return {
        success: false,
        message: `${signal.symbol} otomatik işlem için izin verilmeyen sembol`,
        timestamp: new Date()
      }
    }

    // Güven skoru kontrolü
    if (signal.confidence < this.autoTradeConfig.minConfidence) {
      return {
        success: false,
        message: `Güven skoru yetersiz: ${signal.confidence}`,
        timestamp: new Date()
      }
    }

    // Portföy durumunu kontrol et
    const portfolios = this.portfolioManager.getAllPortfolios()
    if (portfolios.length === 0) {
      return {
        success: false,
        message: 'Aktif portföy bulunamadı',
        timestamp: new Date()
      }
    }

    const portfolio = portfolios[0]
    const portfolioReport = this.portfolioManager.getPortfolioReport(portfolio.id)
    
    // Drawdown kontrolü
    if (portfolioReport.riskMetrics.maxDrawdown < -this.autoTradeConfig.riskManagement.maxDrawdown) {
      return {
        success: false,
        message: 'Maksimum drawdown aşıldı',
        timestamp: new Date()
      }
    }

    // Pozisyon büyüklüğünü hesapla
    const positionSize = portfolio.totalValue * this.autoTradeConfig.maxPositionSize
    const currentPrice = await this.getCurrentPrice(signal.symbol)
    const quantity = positionSize / currentPrice

    try {
      // İşlemi gerçekleştir
      const trade: Trade = {
        id: `auto_trade_${Date.now()}`,
        strategyId: signal.strategyId || 'auto_supervisor',
        symbol: signal.symbol,
        type: signal.action === 'hold' ? 'buy' : signal.action,
        entryPrice: currentPrice,
        quantity: quantity,
        status: 'open',
        entryTime: new Date(),
        stopLoss: currentPrice * (1 - this.autoTradeConfig.riskManagement.stopLoss),
        takeProfit: currentPrice * (1 + this.autoTradeConfig.riskManagement.takeProfit)
      }

      // İşlemi kaydet
      await this.strategyEngine.addTrade(trade)
      this.dailyTradeCount++

      console.log(`🤖 Otomatik işlem gerçekleştirildi: ${signal.symbol} ${signal.action} ${quantity}`)

      return {
        success: true,
        tradeId: trade.id,
        message: `${signal.symbol} ${signal.action} işlemi gerçekleştirildi`,
        timestamp: new Date()
      }

    } catch (error) {
      console.error('Otomatik işlem hatası:', error)
      return {
        success: false,
        message: `İşlem hatası: ${error}`,
        timestamp: new Date()
      }
    }
  }

  // Mevcut fiyatı al
  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const marketData = await this.marketDataService.getMarketData(symbol)
      return marketData?.price || 0
    } catch (error) {
      console.error(`${symbol} fiyat alınamadı:`, error)
      return 0
    }
  }

  // Strateji performans kontrolü ve otomatik askıya alma
  private async checkStrategyPerformance(): Promise<void> {
    const strategies = this.strategyEngine.getAllStrategies()
    
    for (const strategy of strategies) {
      if (strategy.status === 'active') {
        const performance = strategy.performance
        
        // Performans kriterleri
        const shouldSuspend = 
          performance.winRate < 0.4 || // %40'dan düşük başarı oranı
          performance.maxDrawdown > 0.15 || // %15'ten fazla drawdown
          (performance.totalTrades > 10 && performance.averageReturn < -0.02) // Negatif ortalama getiri

        if (shouldSuspend) {
          await this.strategyEngine.updateStrategyStatus(strategy.id, 'inactive')
          
          // Alarm oluştur
          const alert: MarketAlert = {
            id: `strategy_suspend_${strategy.id}_${Date.now()}`,
            type: 'technical_alert',
            severity: 'high',
            symbol: strategy.symbols[0],
            message: `${strategy.name} stratejisi performans düşüklüğü nedeniyle askıya alındı`,
            timestamp: new Date(),
            acknowledged: false
          }
          
          this.alerts.set(alert.id, alert)
          console.log(`⚠️ Strateji askıya alındı: ${strategy.name}`)
        }
      }
    }
  }

  // Strateji yeniden optimizasyonu
  private async reoptimizeStrategy(strategyId: string): Promise<boolean> {
    const strategy = this.strategyEngine.getStrategy(strategyId)
    if (!strategy) return false

    try {
      // AI analizi ile yeni parametreler öner
      const marketData = await this.marketDataService.getMarketData(strategy.symbols[0])
      const technicalAnalysis = await this.marketDataService.analyzeMarket(strategy.symbols[0])
      if (!marketData) {
        console.error(`Market data bulunamadı: ${strategy.symbols[0]}`)
        return false
      }
      
      const aiAnalysis = await this.aiAnalysisService.analyzeAsset(
        strategy.symbols[0],
        marketData,
        technicalAnalysis
      )

      // Yeni parametreler hesapla
      const optimizedParams = this.calculateOptimizedParameters(strategy, aiAnalysis)
      
      // Stratejiyi güncelle
      strategy.parameters = { ...strategy.parameters, ...optimizedParams }
      strategy.lastUpdated = new Date()
      
      this.strategyEngine.updateStrategy(strategyId, strategy)
      
      console.log(`🔄 Strateji yeniden optimize edildi: ${strategy.name}`)
      return true

    } catch (error) {
      console.error(`Strateji optimizasyon hatası: ${strategyId}`, error)
      return false
    }
  }

  // Optimize edilmiş parametreleri hesapla
  private calculateOptimizedParameters(strategy: Strategy, aiAnalysis: AIAnalysisResult): any {
    const params: any = {}

    // AI analizine göre parametreleri ayarla
    if (aiAnalysis.technicalAnalysis.strength > 0.7) {
      // Güçlü sinyal - daha agresif parametreler
      params.stopLoss = Math.max(0.015, (strategy.parameters.stopLoss || 0.02) * 0.8)
      params.takeProfit = Math.min(0.08, (strategy.parameters.takeProfit || 0.04) * 1.2)
    } else if (aiAnalysis.technicalAnalysis.strength < 0.3) {
      // Zayıf sinyal - daha konservatif parametreler
      params.stopLoss = Math.min(0.03, (strategy.parameters.stopLoss || 0.02) * 1.2)
      params.takeProfit = Math.max(0.03, (strategy.parameters.takeProfit || 0.04) * 0.8)
    }

    // Volatiliteye göre ayarla
    if ((aiAnalysis.technicalAnalysis as any).volatility > 0.6) {
      params.stopLoss = Math.max(0.02, params.stopLoss || (strategy.parameters.stopLoss || 0.02))
    }

    return params
  }

  // Ana denetim döngüsü güncellendi
  private async performSupervision(): Promise<void> {
    try {
      console.log('🔍 Sistem denetimi başlatılıyor...')

      // 1. Piyasa verilerini topla
      const marketData = await this.marketDataService.getAllMarketData()
      
      // 2. Her sembol için AI analizi yap
      const analysisResults: AIAnalysisResult[] = []
      for (const data of marketData) {
        try {
          const technicalAnalysis = await this.marketDataService.analyzeMarket(data.symbol)
          const aiAnalysis = await this.aiAnalysisService.analyzeAsset(
            data.symbol,
            data,
            technicalAnalysis
          )
          analysisResults.push(aiAnalysis)
        } catch (error) {
          console.error(`${data.symbol} analiz hatası:`, error)
        }
      }

      // 3. Strateji önerileri oluştur
      const strategyRecommendations: StrategyRecommendation[] = []
      for (const analysis of analysisResults) {
        const recommendations = await this.strategyEngine.generateStrategyRecommendation(
          analysis.symbol,
          marketData.find(m => m.symbol === analysis.symbol)!,
          analysis
        )
        strategyRecommendations.push(...recommendations)
      }

      // 4. Portföy durumunu kontrol et
      const portfolios = this.portfolioManager.getAllPortfolios()
      const rebalanceResults: RebalanceResult[] = []
      for (const portfolio of portfolios) {
        const rebalance = await this.portfolioManager.analyzeRebalancing(portfolio.id)
        rebalanceResults.push(...rebalance)
      }

      // 5. Strateji performans kontrolü
      await this.checkStrategyPerformance()

      // 6. Alarmları kontrol et
      await this.checkAlerts(marketData, analysisResults)

      // 7. Trading sinyalleri oluştur
      await this.generateTradingSignals(analysisResults, strategyRecommendations)

      // 8. Otomatik işlemleri gerçekleştir
      if (this.autoTradeConfig.enabled) {
        await this.executeAutoTrades()
      }

      // 9. Rapor oluştur
      const report = await this.generateSupervisorReport(
        marketData,
        analysisResults,
        strategyRecommendations,
        rebalanceResults
      )

      // 10. Raporu kaydet ve bildirim gönder
      await this.saveReport(report)
      await this.sendNotifications(report)

      console.log('✅ Sistem denetimi tamamlandı')

    } catch (error) {
      console.error('❌ Sistem denetimi hatası:', error)
    }
  }

  // Otomatik işlemleri gerçekleştir
  private async executeAutoTrades(): Promise<void> {
    const signals = Array.from(this.signals.values())
      .filter(s => !s.executed && s.confidence >= this.autoTradeConfig.minConfidence)
      .sort((a, b) => b.confidence - a.confidence)

    for (const signal of signals) {
      const result = await this.executeAutoTrade(signal)
      
      if (result.success) {
        this.markSignalExecuted(signal.id)
        console.log(`🤖 Otomatik işlem: ${result.message}`)
      } else {
        console.log(`⚠️ Otomatik işlem başarısız: ${result.message}`)
      }
    }
  }

  // Alarmları kontrol et
  private async checkAlerts(marketData: MarketData[], analysisResults: AIAnalysisResult[]): Promise<void> {
    const newAlerts: MarketAlert[] = []

    // Fiyat alarmları
    for (const data of marketData) {
      if (Math.abs(data.change24h) > 10) {
        newAlerts.push({
          id: `price_alert_${data.symbol}_${Date.now()}`,
          type: 'price_alert',
          severity: Math.abs(data.change24h) > 20 ? 'high' : 'medium',
          symbol: data.symbol,
          message: `${data.symbol} %${data.change24h.toFixed(2)} değişim gösteriyor`,
          timestamp: new Date(),
          acknowledged: false
        })
      }
    }

    // Teknik analiz alarmları
    for (const analysis of analysisResults) {
      if (analysis.technicalAnalysis.strength > 0.8) {
        newAlerts.push({
          id: `technical_alert_${analysis.symbol}_${Date.now()}`,
          type: 'technical_alert',
          severity: 'medium',
          symbol: analysis.symbol,
          message: `${analysis.symbol} güçlü teknik sinyal: ${analysis.technicalAnalysis.summary}`,
          timestamp: new Date(),
          acknowledged: false
        })
      }
    }

    // Risk alarmları
    const portfolios = this.portfolioManager.getAllPortfolios()
    for (const portfolio of portfolios) {
      const report = this.portfolioManager.getPortfolioReport(portfolio.id)
      if (report.riskMetrics.maxDrawdown < -0.1) {
        newAlerts.push({
          id: `risk_alert_${portfolio.id}_${Date.now()}`,
          type: 'risk_alert',
          severity: 'high',
          symbol: portfolio.name,
          message: `${portfolio.name} drawdown %${(report.riskMetrics.maxDrawdown * 100).toFixed(1)}`,
          timestamp: new Date(),
          acknowledged: false
        })
      }
    }

    // Yeni alarmları ekle
    newAlerts.forEach(alert => {
      this.alerts.set(alert.id, alert)
    })
  }

  // Trading sinyalleri oluştur
  private async generateTradingSignals(
    analysisResults: AIAnalysisResult[],
    strategyRecommendations: StrategyRecommendation[]
  ): Promise<void> {
    const newSignals: TradingSignal[] = []

    // AI önerilerine göre sinyaller
    for (const analysis of analysisResults) {
      if (analysis.aiRecommendation.confidence > 0.7) {
        newSignals.push({
          id: `signal_${analysis.symbol}_${Date.now()}`,
          symbol: analysis.symbol,
          action: analysis.aiRecommendation.action,
          confidence: analysis.aiRecommendation.confidence,
          reasoning: analysis.aiRecommendation.reasoning,
          timeframe: analysis.aiRecommendation.timeframe,
          riskLevel: analysis.aiRecommendation.riskLevel,
          timestamp: new Date(),
          executed: false
        })
      }
    }

    // Strateji önerilerine göre sinyaller
    for (const recommendation of strategyRecommendations) {
      if (recommendation.confidence > 0.6) {
        newSignals.push({
          id: `strategy_signal_${recommendation.strategy.id}_${Date.now()}`,
          symbol: recommendation.strategy.symbols[0],
          action: 'buy', // Strateji önerisi genellikle alım
          confidence: recommendation.confidence,
          reasoning: recommendation.reasoning,
          strategyId: recommendation.strategy.id,
          timeframe: recommendation.strategy.timeframe,
          riskLevel: recommendation.riskLevel,
          timestamp: new Date(),
          executed: false
        })
      }
    }

    // Yeni sinyalleri ekle
    newSignals.forEach(signal => {
      this.signals.set(signal.id, signal)
    })
  }

  // Supervisor raporu oluştur
  private async generateSupervisorReport(
    marketData: MarketData[],
    analysisResults: AIAnalysisResult[],
    strategyRecommendations: StrategyRecommendation[],
    rebalanceResults: RebalanceResult[]
  ): Promise<SupervisorReport> {
    // Piyasa özeti
    const bullishCount = analysisResults.filter(a => a.aiRecommendation.action === 'buy').length
    const bearishCount = analysisResults.filter(a => a.aiRecommendation.action === 'sell').length
    const neutralCount = analysisResults.filter(a => a.aiRecommendation.action === 'hold').length

    const topPerformers = marketData
      .sort((a, b) => b.change24h - a.change24h)
      .slice(0, 5)
      .map(m => m.symbol)

    const worstPerformers = marketData
      .sort((a, b) => a.change24h - b.change24h)
      .slice(0, 5)
      .map(m => m.symbol)

    // Portföy durumu
    const portfolios = this.portfolioManager.getAllPortfolios()
    const portfolioStatus = portfolios.length > 0 ? 
      this.portfolioManager.getPortfolioReport(portfolios[0].id) : null

    // Strateji performansı
    const strategyPerformance = this.strategyEngine.getStrategyPerformanceReport()

    // AI önerileri
    const buySignals = analysisResults
      .filter(a => a.aiRecommendation.action === 'buy' && a.aiRecommendation.confidence > 0.7)
      .map(a => a.symbol)

    const sellSignals = analysisResults
      .filter(a => a.aiRecommendation.action === 'sell' && a.aiRecommendation.confidence > 0.7)
      .map(a => a.symbol)

    const holdSignals = analysisResults
      .filter(a => a.aiRecommendation.action === 'hold')
      .map(a => a.symbol)

    const newStrategies = strategyRecommendations
      .filter(r => r.confidence > 0.6)
      .map(r => r.strategy.name)

    // Alarmlar
    const highAlerts = Array.from(this.alerts.values())
      .filter(a => a.severity === 'high' && !a.acknowledged)
      .map(a => a.message)

    const mediumAlerts = Array.from(this.alerts.values())
      .filter(a => a.severity === 'medium' && !a.acknowledged)
      .map(a => a.message)

    const lowAlerts = Array.from(this.alerts.values())
      .filter(a => a.severity === 'low' && !a.acknowledged)
      .map(a => a.message)

    // Sonraki aksiyonlar
    const immediate: string[] = []
    const shortTerm: string[] = []
    const longTerm: string[] = []

    if (rebalanceResults.length > 0) {
      immediate.push('Portföy yeniden dengeleme gerekli')
    }

    if (buySignals.length > 0) {
      immediate.push(`${buySignals.length} alım sinyali mevcut`)
    }

    if (sellSignals.length > 0) {
      immediate.push(`${sellSignals.length} satım sinyali mevcut`)
    }

    if (newStrategies.length > 0) {
      shortTerm.push(`${newStrategies.length} yeni strateji önerisi`)
    }

    if (strategyPerformance.averageWinRate < 0.5) {
      shortTerm.push('Strateji performansı düşük, gözden geçirme gerekli')
    }

    return {
      timestamp: new Date(),
      marketSummary: {
        totalSymbols: marketData.length,
        bullishCount,
        bearishCount,
        neutralCount,
        topPerformers,
        worstPerformers
      },
      portfolioStatus: portfolioStatus ? {
        totalValue: portfolioStatus.portfolio.totalValue,
        totalPnL: portfolioStatus.riskMetrics.totalPnL,
        totalPnLPercentage: portfolioStatus.riskMetrics.totalPnLPercentage,
        riskLevel: portfolioStatus.portfolio.riskLevel,
        rebalanceNeeded: portfolioStatus.rebalanceNeeded
      } : {
        totalValue: 0,
        totalPnL: 0,
        totalPnLPercentage: 0,
        riskLevel: 'medium',
        rebalanceNeeded: false
      },
      strategyPerformance: {
        totalStrategies: strategyPerformance.totalStrategies,
        activeStrategies: strategyPerformance.activeStrategies,
        averageWinRate: strategyPerformance.averageWinRate,
        bestStrategy: strategyPerformance.bestStrategy?.name || 'Yok',
        worstStrategy: strategyPerformance.worstStrategy?.name || 'Yok'
      },
      aiRecommendations: {
        buySignals,
        sellSignals,
        holdSignals,
        newStrategies
      },
      alerts: {
        high: highAlerts,
        medium: mediumAlerts,
        low: lowAlerts
      },
      nextActions: {
        immediate,
        shortTerm,
        longTerm
      }
    }
  }

  // Raporu kaydet
  private async saveReport(report: SupervisorReport): Promise<void> {
    // Burada raporu veritabanına kaydedebiliriz
    console.log('📊 Supervisor raporu kaydedildi:', report.timestamp)
  }

  // Bildirimleri gönder
  private async sendNotifications(report: SupervisorReport): Promise<void> {
    // Yüksek öncelikli alarmlar varsa bildirim gönder
    if (report.alerts.high.length > 0) {
      console.log('🚨 Yüksek öncelikli alarmlar:', report.alerts.high)
    }

    // Önemli sinyaller varsa bildirim gönder
    if (report.aiRecommendations.buySignals.length > 0 || 
        report.aiRecommendations.sellSignals.length > 0) {
      console.log('📈 Trading sinyalleri:', {
        buy: report.aiRecommendations.buySignals,
        sell: report.aiRecommendations.sellSignals
      })
    }
  }

  // Manuel rapor oluştur
  async generateManualReport(): Promise<SupervisorReport> {
    const marketData = await this.marketDataService.getAllMarketData()
    const analysisResults: AIAnalysisResult[] = []

    for (const data of marketData) {
      try {
        const technicalAnalysis = await this.marketDataService.analyzeMarket(data.symbol)
        const aiAnalysis = await this.aiAnalysisService.analyzeAsset(
          data.symbol,
          data,
          technicalAnalysis
        )
        analysisResults.push(aiAnalysis)
      } catch (error) {
        console.error(`${data.symbol} analiz hatası:`, error)
      }
    }

    const strategyRecommendations: StrategyRecommendation[] = []
    for (const analysis of analysisResults) {
      const recommendations = await this.strategyEngine.generateStrategyRecommendation(
        analysis.symbol,
        marketData.find(m => m.symbol === analysis.symbol)!,
        analysis
      )
      strategyRecommendations.push(...recommendations)
    }

    const portfolios = this.portfolioManager.getAllPortfolios()
    const rebalanceResults: RebalanceResult[] = []
    for (const portfolio of portfolios) {
      const rebalance = await this.portfolioManager.analyzeRebalancing(portfolio.id)
      rebalanceResults.push(...rebalance)
    }

    return await this.generateSupervisorReport(
      marketData,
      analysisResults,
      strategyRecommendations,
      rebalanceResults
    )
  }

  // Rapor oluştur (generateManualReport için alias)
  async generateReport(): Promise<SupervisorReport> {
    return await this.generateManualReport()
  }

  // Durum bilgisi al
  getStatus(): { isRunning: boolean; timestamp: Date } {
    return {
      isRunning: this.isRunning,
      timestamp: new Date()
    }
  }

  // Alarmları al
  getAlerts(): MarketAlert[] {
    return Array.from(this.alerts.values())
  }

  // Sinyalleri al
  getSignals(): TradingSignal[] {
    return Array.from(this.signals.values())
  }

  // Alarmı onayla
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
      this.alerts.set(alertId, alert)
      return true
    }
    return false
  }

  // Sinyali işaretle
  markSignalExecuted(signalId: string): boolean {
    const signal = this.signals.get(signalId)
    if (signal) {
      signal.executed = true
      this.signals.set(signalId, signal)
      return true
    }
    return false
  }

  // Servisleri al
  getServices() {
    return {
      marketData: this.marketDataService,
      aiAnalysis: this.aiAnalysisService,
      strategyEngine: this.strategyEngine,
      portfolioManager: this.portfolioManager
    }
  }
}

export default SupervisorAgent 