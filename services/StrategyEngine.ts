import { MarketData, MarketAnalysis } from "./MarketDataService"
import { AIAnalysisResult } from "./AIAnalysisService"

export interface Strategy {
  id: string
  name: string
  description: string
  symbols: string[]
  timeframe: 'short' | 'medium' | 'long'
  type: 'trend_following' | 'mean_reversion' | 'breakout' | 'momentum' | 'custom'
  parameters: {
    rsiPeriod?: number
    macdFast?: number
    macdSlow?: number
    bollingerPeriod?: number
    stopLoss?: number
    takeProfit?: number
    maxDrawdown?: number
  }
  conditions: {
    entry: string[]
    exit: string[]
  }
  status: 'active' | 'inactive' | 'testing'
  performance: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    totalPnL: number
    sharpeRatio: number
    maxDrawdown: number
    averageReturn: number
  }
  createdAt: Date
  lastUpdated: Date
}

export interface Trade {
  id: string
  strategyId: string
  symbol: string
  type: 'buy' | 'sell'
  entryPrice: number
  exitPrice?: number
  quantity: number
  status: 'open' | 'closed' | 'cancelled'
  entryTime: Date
  exitTime?: Date
  pnl?: number
  pnlPercentage?: number
  stopLoss?: number
  takeProfit?: number
}

export interface StrategyRecommendation {
  strategy: Strategy
  confidence: number
  reasoning: string
  expectedReturn: number
  riskLevel: 'low' | 'medium' | 'high'
  suggestedAllocation: number
}

class StrategyEngine {
  private strategies: Map<string, Strategy> = new Map()
  private trades: Map<string, Trade> = new Map()
  private activeStrategies: Set<string> = new Set()

  constructor() {
    this.initializeDefaultStrategies()
  }

  private initializeDefaultStrategies() {
    const defaultStrategies: Strategy[] = [
      {
        id: 'rsi_macd_crossover',
        name: 'RSI + MACD Crossover',
        description: 'RSI aşırı alım/satım bölgelerinde MACD crossover sinyalleri',
        symbols: ['BTCUSDT', 'ETHUSDT', 'THYAO', 'GARAN'],
        timeframe: 'medium',
        type: 'trend_following',
        parameters: {
          rsiPeriod: 14,
          macdFast: 12,
          macdSlow: 26,
          stopLoss: 0.02,
          takeProfit: 0.05,
          maxDrawdown: 0.15
        },
        conditions: {
          entry: ['RSI < 30 AND MACD > Signal', 'RSI > 70 AND MACD < Signal'],
          exit: ['Take Profit reached', 'Stop Loss hit', 'RSI > 70 (for buy)', 'RSI < 30 (for sell)']
        },
        status: 'active',
        performance: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalPnL: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          averageReturn: 0
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: 'bollinger_breakout',
        name: 'Bollinger Bands Breakout',
        description: 'Bollinger Bands kırılımlarında pozisyon alma',
        symbols: ['SOLUSDT', 'ADAUSDT', 'AKBNK', 'EREGL'],
        timeframe: 'short',
        type: 'breakout',
        parameters: {
          bollingerPeriod: 20,
          stopLoss: 0.03,
          takeProfit: 0.06,
          maxDrawdown: 0.12
        },
        conditions: {
          entry: ['Price > Upper Band', 'Price < Lower Band'],
          exit: ['Price returns to middle band', 'Take Profit', 'Stop Loss']
        },
        status: 'active',
        performance: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalPnL: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          averageReturn: 0
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: 'volume_price_momentum',
        name: 'Volume + Price Momentum',
        description: 'Yüksek hacimle birlikte fiyat momentumu takibi',
        symbols: ['BNBUSDT', 'LINKUSDT', 'KCHOL'],
        timeframe: 'short',
        type: 'momentum',
        parameters: {
          stopLoss: 0.025,
          takeProfit: 0.04,
          maxDrawdown: 0.10
        },
        conditions: {
          entry: ['Volume > Average AND Price > SMA20', 'Volume > Average AND Price < SMA20'],
          exit: ['Volume decreases', 'Price crosses SMA20', 'Take Profit', 'Stop Loss']
        },
        status: 'active',
        performance: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalPnL: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          averageReturn: 0
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    ]

    defaultStrategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy)
      if (strategy.status === 'active') {
        this.activeStrategies.add(strategy.id)
      }
    })
  }

  // Strateji önerisi üret
  async generateStrategyRecommendation(
    symbol: string,
    marketData: MarketData,
    aiAnalysis: AIAnalysisResult
  ): Promise<StrategyRecommendation[]> {
    const recommendations: StrategyRecommendation[] = []

    // Mevcut stratejileri analiz et
    Array.from(this.strategies.entries()).forEach(([strategyId, strategy]) => {
      if (strategy.symbols.includes(symbol)) {
        const confidence = this.calculateStrategyConfidence(strategy, aiAnalysis)
        const expectedReturn = this.calculateExpectedReturn(strategy, aiAnalysis)
        const riskLevel = this.calculateRiskLevel(strategy, aiAnalysis)

        if (confidence > 0.6) {
          recommendations.push({
            strategy,
            confidence,
            reasoning: this.generateReasoning(strategy, aiAnalysis),
            expectedReturn,
            riskLevel,
            suggestedAllocation: this.calculateSuggestedAllocation(confidence, riskLevel)
          })
        }
      }
    })

    // Yeni strateji önerisi
    const newStrategy = await this.generateNewStrategy(symbol, aiAnalysis)
    if (newStrategy) {
      recommendations.push(newStrategy)
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }

  private calculateStrategyConfidence(strategy: Strategy, aiAnalysis: AIAnalysisResult): number {
    let confidence = 0.5

    // AI önerisi ile strateji uyumu
    if (aiAnalysis.aiRecommendation.action === 'buy' && strategy.type === 'trend_following') {
      confidence += 0.2
    } else if (aiAnalysis.aiRecommendation.action === 'sell' && strategy.type === 'mean_reversion') {
      confidence += 0.2
    }

    // Teknik analiz uyumu
    if (aiAnalysis.technicalAnalysis.strength > 0.7) {
      confidence += 0.15
    }

    // Sentiment uyumu
    if (aiAnalysis.sentimentAnalysis.score > 0.6) {
      confidence += 0.1
    }

    // Strateji performansı
    if (strategy.performance.winRate > 0.6) {
      confidence += 0.15
    }

    return Math.min(confidence, 1.0)
  }

  private calculateExpectedReturn(strategy: Strategy, aiAnalysis: AIAnalysisResult): number {
    const baseReturn = strategy.performance.averageReturn || 0.05
    const aiConfidence = aiAnalysis.aiRecommendation.confidence
    const sentimentScore = aiAnalysis.sentimentAnalysis.score

    return baseReturn * (1 + aiConfidence * 0.5 + sentimentScore * 0.3)
  }

  private calculateRiskLevel(strategy: Strategy, aiAnalysis: AIAnalysisResult): 'low' | 'medium' | 'high' {
    const volatility = aiAnalysis.technicalAnalysis.strength
    const maxDrawdown = strategy.performance.maxDrawdown || 0.1

    if (volatility < 0.3 && maxDrawdown < 0.05) return 'low'
    if (volatility > 0.7 || maxDrawdown > 0.15) return 'high'
    return 'medium'
  }

  private generateReasoning(strategy: Strategy, aiAnalysis: AIAnalysisResult): string {
    const reasons = []

    if (aiAnalysis.aiRecommendation.action === 'buy') {
      reasons.push('AI alım sinyali veriyor')
    } else if (aiAnalysis.aiRecommendation.action === 'sell') {
      reasons.push('AI satım sinyali veriyor')
    }

    if (strategy.performance.winRate > 0.6) {
      reasons.push(`Strateji başarı oranı: %${(strategy.performance.winRate * 100).toFixed(1)}`)
    }

    if (aiAnalysis.sentimentAnalysis.score > 0.6) {
      reasons.push('Pozitif sentiment')
    }

    return reasons.join(', ')
  }

  private calculateSuggestedAllocation(confidence: number, riskLevel: 'low' | 'medium' | 'high'): number {
    let allocation = confidence * 0.2 // Maksimum %20

    if (riskLevel === 'high') allocation *= 0.5
    else if (riskLevel === 'low') allocation *= 1.2

    return Math.min(allocation, 0.2) // Maksimum %20
  }

  private async generateNewStrategy(symbol: string, aiAnalysis: AIAnalysisResult): Promise<StrategyRecommendation | null> {
    // AI analizine göre yeni strateji önerisi
    const strategyName = `${symbol} AI Optimized Strategy`
    const strategyType = aiAnalysis.aiRecommendation.timeframe === 'short' ? 'momentum' : 'trend_following'

    const newStrategy: Strategy = {
      id: `ai_generated_${Date.now()}`,
      name: strategyName,
      description: `AI analizi sonucu ${symbol} için özel strateji`,
      symbols: [symbol],
      timeframe: aiAnalysis.aiRecommendation.timeframe,
      type: strategyType,
      parameters: {
        stopLoss: 0.02,
        takeProfit: 0.05,
        maxDrawdown: 0.12
      },
      conditions: {
        entry: ['AI Buy Signal', 'Technical Confirmation'],
        exit: ['AI Sell Signal', 'Take Profit', 'Stop Loss']
      },
      status: 'testing',
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnL: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        averageReturn: 0
      },
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    this.strategies.set(newStrategy.id, newStrategy)

    return {
      strategy: newStrategy,
      confidence: aiAnalysis.aiRecommendation.confidence,
      reasoning: 'AI tarafından özel olarak önerilen strateji',
      expectedReturn: aiAnalysis.aiRecommendation.confidence * 0.1,
      riskLevel: aiAnalysis.aiRecommendation.riskLevel,
      suggestedAllocation: 0.1
    }
  }

  // Strateji performansını güncelle
  async updateStrategyPerformance(strategyId: string, trade: Trade) {
    const strategy = this.strategies.get(strategyId)
    if (!strategy) return

    const performance = strategy.performance

    if (trade.status === 'closed' && trade.pnl !== undefined) {
      performance.totalTrades++
      performance.totalPnL += trade.pnl

      if (trade.pnl > 0) {
        performance.winningTrades++
      } else {
        performance.losingTrades++
      }

      performance.winRate = performance.winningTrades / performance.totalTrades
      performance.averageReturn = performance.totalPnL / performance.totalTrades

      // Sharpe ratio hesapla (basitleştirilmiş)
      performance.sharpeRatio = performance.averageReturn / (performance.maxDrawdown || 0.01)

      // Max drawdown güncelle
      if (trade.pnl < 0 && Math.abs(trade.pnl) > performance.maxDrawdown) {
        performance.maxDrawdown = Math.abs(trade.pnl)
      }
    }

    strategy.lastUpdated = new Date()
    this.strategies.set(strategyId, strategy)
  }

  // İşlem ekle
  async addTrade(trade: Trade): Promise<string> {
    this.trades.set(trade.id, trade)
    
    // Strateji performansını güncelle
    if (trade.strategyId) {
      await this.updateStrategyPerformance(trade.strategyId, trade)
    }
    
    return trade.id
  }

  // Strateji güncelle
  async updateStrategy(strategyId: string, updatedStrategy: Strategy): Promise<boolean> {
    try {
      this.strategies.set(strategyId, updatedStrategy)
      return true
    } catch (error) {
      console.error('Strateji güncelleme hatası:', error)
      return false
    }
  }

  // Tüm işlemleri al
  getAllTrades(): Trade[] {
    return Array.from(this.trades.values())
  }

  // Stratejiye ait işlemleri al
  getTradesByStrategy(strategyId: string): Trade[] {
    return Array.from(this.trades.values()).filter(t => t.strategyId === strategyId)
  }

  // Açık işlemleri al
  getOpenTrades(): Trade[] {
    return Array.from(this.trades.values()).filter(t => t.status === 'open')
  }

  // Strateji durumunu değiştir
  async toggleStrategyStatus(strategyId: string): Promise<boolean> {
    const strategy = this.strategies.get(strategyId)
    if (!strategy) return false

    if (strategy.status === 'active') {
      strategy.status = 'inactive'
      this.activeStrategies.delete(strategyId)
    } else {
      strategy.status = 'active'
      this.activeStrategies.add(strategyId)
    }

    strategy.lastUpdated = new Date()
    this.strategies.set(strategyId, strategy)
    return true
  }

  // Tüm stratejileri al
  getAllStrategies(): Strategy[] {
    return Array.from(this.strategies.values())
  }

  // Aktif stratejileri al
  getActiveStrategies(): Strategy[] {
    return Array.from(this.strategies.values()).filter(s => s.status === 'active')
  }

  // Strateji detayını al
  getStrategy(strategyId: string): Strategy | null {
    return this.strategies.get(strategyId) || null
  }

  // Strateji ekle
  async addStrategy(strategy: Omit<Strategy, 'id' | 'createdAt' | 'lastUpdated'>): Promise<string> {
    const id = `strategy_${Date.now()}`
    const newStrategy: Strategy = {
      ...strategy,
      id,
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    this.strategies.set(id, newStrategy)
    if (newStrategy.status === 'active') {
      this.activeStrategies.add(id)
    }

    return id
  }

  async createStrategy(strategyData: any): Promise<Strategy | null> {
    try {
      const newStrategy: Strategy = {
        id: `strategy_${Date.now()}`,
        name: strategyData.name || 'Yeni Strateji',
        description: strategyData.description || '',
        symbols: strategyData.symbols || [],
        timeframe: strategyData.timeframe || 'medium',
        type: strategyData.type || 'trend_following',
        parameters: strategyData.parameters || {},
        conditions: {
          entry: strategyData.conditions?.entry || [],
          exit: strategyData.conditions?.exit || []
        },
        status: 'inactive',
        performance: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalPnL: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          averageReturn: 0
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      }

      this.strategies.set(newStrategy.id, newStrategy)
      return newStrategy
    } catch (error) {
      console.error('Strateji oluşturma hatası:', error)
      return null
    }
  }

  async updateStrategyStatus(strategyId: string, status: string): Promise<boolean> {
    try {
      const strategy = this.strategies.get(strategyId)
      if (!strategy) return false

      if (status === 'toggle') {
        strategy.status = strategy.status === 'active' ? 'inactive' : 'active'
      } else {
        strategy.status = status as 'active' | 'inactive' | 'testing'
      }

      strategy.lastUpdated = new Date()
      this.strategies.set(strategyId, strategy)

      if (strategy.status === 'active') {
        this.activeStrategies.add(strategyId)
      } else {
        this.activeStrategies.delete(strategyId)
      }

      return true
    } catch (error) {
      console.error('Strateji durumu güncelleme hatası:', error)
      return false
    }
  }

  async deleteStrategy(strategyId: string): Promise<boolean> {
    try {
      const strategy = this.strategies.get(strategyId)
      if (!strategy) return false

      this.strategies.delete(strategyId)
      this.activeStrategies.delete(strategyId)

      // İlgili işlemleri de sil
      const tradesToDelete: string[] = []
      Array.from(this.trades.entries()).forEach(([tradeId, trade]) => {
        if (trade.strategyId === strategyId) {
          tradesToDelete.push(tradeId)
        }
      })
      
      tradesToDelete.forEach(tradeId => {
        this.trades.delete(tradeId)
      })

      return true
    } catch (error) {
      console.error('Strateji silme hatası:', error)
      return false
    }
  }

  async closeStrategyPosition(strategyId: string): Promise<boolean> {
    try {
      const strategy = this.strategies.get(strategyId)
      if (!strategy) return false

      // Bu stratejiye ait açık işlemleri kapat
      let closedCount = 0
      Array.from(this.trades.entries()).forEach(([tradeId, trade]) => {
        if (trade.strategyId === strategyId && trade.status === 'open') {
          trade.status = 'closed'
          trade.exitTime = new Date()
          trade.exitPrice = trade.entryPrice // Basit kapatma
          this.trades.set(tradeId, trade)
          closedCount++
        }
      })

      return closedCount > 0
    } catch (error) {
      console.error('Strateji pozisyonu kapatma hatası:', error)
      return false
    }
  }

  // Strateji performans raporu
  getStrategyPerformanceReport(): {
    totalStrategies: number
    activeStrategies: number
    averageWinRate: number
    totalPnL: number
    bestStrategy: Strategy | null
    worstStrategy: Strategy | null
  } {
    const strategies = Array.from(this.strategies.values())
    const activeStrategies = strategies.filter(s => s.status === 'active')

    const totalWinRate = strategies.reduce((sum, s) => sum + s.performance.winRate, 0)
    const averageWinRate = strategies.length > 0 ? totalWinRate / strategies.length : 0

    const totalPnL = strategies.reduce((sum, s) => sum + s.performance.totalPnL, 0)

    const bestStrategy = strategies.reduce((best, current) => 
      current.performance.winRate > best.performance.winRate ? current : best
    )

    const worstStrategy = strategies.reduce((worst, current) => 
      current.performance.winRate < worst.performance.winRate ? current : worst
    )

    return {
      totalStrategies: strategies.length,
      activeStrategies: activeStrategies.length,
      averageWinRate,
      totalPnL,
      bestStrategy: strategies.length > 0 ? bestStrategy : null,
      worstStrategy: strategies.length > 0 ? worstStrategy : null
    }
  }
}

export default StrategyEngine 