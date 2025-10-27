import { MarketData } from "./MarketDataService"
import { AIAnalysisResult } from "./AIAnalysisService"
import { Strategy, Trade } from "./StrategyEngine"

export interface PortfolioAsset {
  symbol: string
  quantity: number
  averagePrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  unrealizedPnLPercentage: number
  allocation: number
  lastUpdated: Date
}

export interface Portfolio {
  id: string
  name: string
  totalValue: number
  cash: number
  assets: Map<string, PortfolioAsset>
  riskLevel: 'low' | 'medium' | 'high'
  maxDrawdown: number
  targetAllocation: Map<string, number>
  rebalanceThreshold: number
  createdAt: Date
  lastUpdated: Date
}

export interface RebalanceResult {
  symbol: string
  currentAllocation: number
  targetAllocation: number
  action: 'buy' | 'sell' | 'hold'
  quantity: number
  estimatedCost: number
  priority: 'high' | 'medium' | 'low'
}

export interface RiskMetrics {
  totalValue: number
  totalPnL: number
  totalPnLPercentage: number
  maxDrawdown: number
  sharpeRatio: number
  volatility: number
  beta: number
  correlation: number
}

class PortfolioManager {
  private portfolios: Map<string, Portfolio> = new Map()
  private trades: Map<string, Trade> = new Map()
  private riskLimits: Map<string, {
    maxPositionSize: number
    maxDrawdown: number
    maxLeverage: number
    stopLossPercentage: number
  }> = new Map()

  constructor() {
    this.initializeDefaultPortfolio()
    this.initializeRiskLimits()
  }

  private initializeDefaultPortfolio() {
    const defaultPortfolio: Portfolio = {
      id: 'main_portfolio',
      name: 'Ana Portföy',
      totalValue: 100000, // 100,000 TL başlangıç
      cash: 50000, // %50 nakit
      assets: new Map(),
      riskLevel: 'medium',
      maxDrawdown: 0.15,
      targetAllocation: new Map([
        ['BTCUSDT', 0.15],
        ['ETHUSDT', 0.10],
        ['THYAO', 0.10],
        ['GARAN', 0.10],
        ['CASH', 0.55]
      ]),
      rebalanceThreshold: 0.05, // %5 sapma
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    this.portfolios.set(defaultPortfolio.id, defaultPortfolio)
  }

  private initializeRiskLimits() {
    this.riskLimits.set('main_portfolio', {
      maxPositionSize: 0.20, // Maksimum %20 tek pozisyon
      maxDrawdown: 0.15, // Maksimum %15 drawdown
      maxLeverage: 1.0, // Kaldıraç yok
      stopLossPercentage: 0.05 // %5 stop loss
    })
  }

  // Portföy durumunu güncelle
  async updatePortfolio(portfolioId: string, marketData: MarketData[]): Promise<void> {
    const portfolio = this.portfolios.get(portfolioId)
    if (!portfolio) return

    let totalValue = portfolio.cash
    const updatedAssets = new Map<string, PortfolioAsset>()

    // Her varlık için güncelleme
    for (const [symbol, asset] of portfolio.assets) {
      const marketInfo = marketData.find(m => m.symbol === symbol)
      if (marketInfo) {
        const currentPrice = marketInfo.price
        const marketValue = asset.quantity * currentPrice
        const unrealizedPnL = marketValue - (asset.quantity * asset.averagePrice)
        const unrealizedPnLPercentage = (unrealizedPnL / (asset.quantity * asset.averagePrice)) * 100

        const updatedAsset: PortfolioAsset = {
          ...asset,
          currentPrice,
          marketValue,
          unrealizedPnL,
          unrealizedPnLPercentage,
          lastUpdated: new Date()
        }

        updatedAssets.set(symbol, updatedAsset)
        totalValue += marketValue
      }
    }

    // Allocation hesapla
    for (const [symbol, asset] of updatedAssets) {
      asset.allocation = (asset.marketValue / totalValue) * 100
    }

    portfolio.assets = updatedAssets
    portfolio.totalValue = totalValue
    portfolio.lastUpdated = new Date()

    this.portfolios.set(portfolioId, portfolio)
  }

  // Yeniden dengeleme analizi
  async analyzeRebalancing(portfolioId: string): Promise<RebalanceResult[]> {
    const portfolio = this.portfolios.get(portfolioId)
    if (!portfolio) return []

    const results: RebalanceResult[] = []

    for (const [symbol, targetAllocation] of portfolio.targetAllocation) {
      if (symbol === 'CASH') {
        const currentCashAllocation = (portfolio.cash / portfolio.totalValue) * 100
        const difference = targetAllocation - currentCashAllocation

        if (Math.abs(difference) > portfolio.rebalanceThreshold * 100) {
          results.push({
            symbol: 'CASH',
            currentAllocation: currentCashAllocation,
            targetAllocation,
            action: difference > 0 ? 'buy' : 'sell',
            quantity: Math.abs(difference) / 100 * portfolio.totalValue,
            estimatedCost: Math.abs(difference) / 100 * portfolio.totalValue,
            priority: Math.abs(difference) > 10 ? 'high' : 'medium'
          })
        }
        continue
      }

      const asset = portfolio.assets.get(symbol)
      if (asset) {
        const currentAllocation = asset.allocation
        const difference = targetAllocation - currentAllocation

        if (Math.abs(difference) > portfolio.rebalanceThreshold * 100) {
          const action = difference > 0 ? 'buy' : 'sell'
          const quantity = Math.abs(difference) / 100 * portfolio.totalValue / asset.currentPrice

          results.push({
            symbol,
            currentAllocation,
            targetAllocation,
            action,
            quantity,
            estimatedCost: Math.abs(difference) / 100 * portfolio.totalValue,
            priority: Math.abs(difference) > 10 ? 'high' : 'medium'
          })
        }
      } else if (targetAllocation > 0) {
        // Yeni varlık ekleme
        const quantity = (targetAllocation / 100) * portfolio.totalValue / 1000 // Varsayılan fiyat
        results.push({
          symbol,
          currentAllocation: 0,
          targetAllocation,
          action: 'buy',
          quantity,
          estimatedCost: (targetAllocation / 100) * portfolio.totalValue,
          priority: 'medium'
        })
      }
    }

    return results.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // Pozisyon aç
  async openPosition(
    portfolioId: string,
    symbol: string,
    quantity: number,
    price: number,
    strategyId?: string
  ): Promise<Trade | null> {
    const portfolio = this.portfolios.get(portfolioId)
    if (!portfolio) return null

    const riskLimit = this.riskLimits.get(portfolioId)
    if (!riskLimit) return null

    // Risk kontrolü
    const positionValue = quantity * price
    const positionSize = positionValue / portfolio.totalValue

    if (positionSize > riskLimit.maxPositionSize) {
      console.warn(`Pozisyon büyüklüğü risk limitini aşıyor: ${positionSize} > ${riskLimit.maxPositionSize}`)
      return null
    }

    // Nakit kontrolü
    if (positionValue > portfolio.cash) {
      console.warn('Yetersiz nakit')
      return null
    }

    // Trade oluştur
    const trade: Trade = {
      id: `trade_${Date.now()}`,
      strategyId: strategyId || 'manual',
      symbol,
      type: 'buy',
      entryPrice: price,
      quantity,
      status: 'open',
      entryTime: new Date(),
      stopLoss: price * (1 - riskLimit.stopLossPercentage),
      takeProfit: price * 1.05
    }

    // Portföy güncelle
    const existingAsset = portfolio.assets.get(symbol)
    if (existingAsset) {
      const totalQuantity = existingAsset.quantity + quantity
      const totalCost = (existingAsset.quantity * existingAsset.averagePrice) + (quantity * price)
      const newAveragePrice = totalCost / totalQuantity

      existingAsset.quantity = totalQuantity
      existingAsset.averagePrice = newAveragePrice
      existingAsset.lastUpdated = new Date()
    } else {
      portfolio.assets.set(symbol, {
        symbol,
        quantity,
        averagePrice: price,
        currentPrice: price,
        marketValue: quantity * price,
        unrealizedPnL: 0,
        unrealizedPnLPercentage: 0,
        allocation: (quantity * price / portfolio.totalValue) * 100,
        lastUpdated: new Date()
      })
    }

    portfolio.cash -= positionValue
    portfolio.lastUpdated = new Date()

    this.trades.set(trade.id, trade)
    this.portfolios.set(portfolioId, portfolio)

    return trade
  }

  // Pozisyon kapat
  async closePosition(
    portfolioId: string,
    symbol: string,
    quantity: number,
    price: number,
    tradeId?: string
  ): Promise<Trade | null> {
    const portfolio = this.portfolios.get(portfolioId)
    if (!portfolio) return null

    const asset = portfolio.assets.get(symbol)
    if (!asset || asset.quantity < quantity) {
      console.warn('Yetersiz miktar')
      return null
    }

    // Trade oluştur
    const trade: Trade = {
      id: tradeId || `trade_${Date.now()}`,
      strategyId: 'manual',
      symbol,
      type: 'sell',
      entryPrice: asset.averagePrice,
      exitPrice: price,
      quantity,
      status: 'closed',
      entryTime: asset.lastUpdated,
      exitTime: new Date(),
      pnl: (price - asset.averagePrice) * quantity,
      pnlPercentage: ((price - asset.averagePrice) / asset.averagePrice) * 100
    }

    // Portföy güncelle
    if (asset.quantity === quantity) {
      portfolio.assets.delete(symbol)
    } else {
      asset.quantity -= quantity
      asset.lastUpdated = new Date()
    }

    const saleValue = quantity * price
    portfolio.cash += saleValue
    portfolio.lastUpdated = new Date()

    this.trades.set(trade.id, trade)
    this.portfolios.set(portfolioId, portfolio)

    return trade
  }

  // Risk metrikleri hesapla
  async calculateRiskMetrics(portfolioId: string): Promise<RiskMetrics> {
    const portfolio = this.portfolios.get(portfolioId)
    if (!portfolio) {
      throw new Error('Portföy bulunamadı')
    }

    let totalPnL = 0
    let totalCost = 0
    let maxDrawdown = 0
    let volatility = 0

    // PnL hesapla
    for (const [symbol, asset] of portfolio.assets) {
      const cost = asset.quantity * asset.averagePrice
      const currentValue = asset.quantity * asset.currentPrice
      const pnl = currentValue - cost

      totalPnL += pnl
      totalCost += cost

      // Drawdown hesapla
      const drawdown = asset.unrealizedPnLPercentage
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown
      }
    }

    const totalPnLPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

    // Basit Sharpe ratio (risk-free rate = 0)
    const returns = portfolio.assets.size > 0 ? totalPnLPercentage / portfolio.assets.size : 0
    const sharpeRatio = volatility > 0 ? returns / volatility : 0

    return {
      totalValue: portfolio.totalValue,
      totalPnL,
      totalPnLPercentage,
      maxDrawdown,
      sharpeRatio,
      volatility,
      beta: 1.0, // Basitleştirilmiş
      correlation: 0.5 // Basitleştirilmiş
    }
  }

  // AI önerilerine göre portföy güncelle
  async updatePortfolioBasedOnAI(
    portfolioId: string,
    aiAnalysis: AIAnalysisResult,
    marketData: MarketData
  ): Promise<{
    action: 'buy' | 'sell' | 'hold'
    quantity?: number
    reasoning: string
  }> {
    const portfolio = this.portfolios.get(portfolioId)
    if (!portfolio) {
      return { action: 'hold', reasoning: 'Portföy bulunamadı' }
    }

    const { symbol } = aiAnalysis
    const asset = portfolio.assets.get(symbol)
    const aiRecommendation = aiAnalysis.aiRecommendation

    // Risk kontrolü
    const riskLimit = this.riskLimits.get(portfolioId)
    if (!riskLimit) {
      return { action: 'hold', reasoning: 'Risk limitleri tanımlanmamış' }
    }

    let action: 'buy' | 'sell' | 'hold' = 'hold'
    let quantity: number | undefined
    let reasoning = ''

    if (aiRecommendation.action === 'buy' && aiRecommendation.confidence > 0.7) {
      // Alım sinyali
      const availableCash = portfolio.cash
      const maxPositionValue = portfolio.totalValue * riskLimit.maxPositionSize
      const currentPositionValue = asset ? asset.marketValue : 0
      const remainingCapacity = maxPositionValue - currentPositionValue

      if (remainingCapacity > 0 && availableCash > 0) {
        const suggestedAllocation = aiRecommendation.confidence * 0.1 // %10'a kadar
        const targetValue = Math.min(
          portfolio.totalValue * suggestedAllocation,
          remainingCapacity,
          availableCash
        )

        quantity = targetValue / marketData.price
        action = 'buy'
        reasoning = `AI güven: %${(aiRecommendation.confidence * 100).toFixed(1)}, Önerilen alım: ${quantity.toFixed(4)} ${symbol}`
      } else {
        reasoning = 'Yetersiz nakit veya pozisyon limiti dolu'
      }
    } else if (aiRecommendation.action === 'sell' && asset && aiRecommendation.confidence > 0.7) {
      // Satım sinyali
      const sellPercentage = aiRecommendation.confidence * 0.5 // %50'ye kadar
      quantity = asset.quantity * sellPercentage
      action = 'sell'
      reasoning = `AI güven: %${(aiRecommendation.confidence * 100).toFixed(1)}, Önerilen satım: ${quantity.toFixed(4)} ${symbol}`
    } else {
      reasoning = `AI önerisi: ${aiRecommendation.action}, Güven: %${(aiRecommendation.confidence * 100).toFixed(1)}`
    }

    return { action, quantity, reasoning }
  }

  // Portföy raporu
  getPortfolioReport(portfolioId: string): {
    portfolio: Portfolio
    riskMetrics: RiskMetrics
    topPerformers: PortfolioAsset[]
    worstPerformers: PortfolioAsset[]
    rebalanceNeeded: boolean
  } {
    const portfolio = this.portfolios.get(portfolioId)
    if (!portfolio) {
      throw new Error('Portföy bulunamadı')
    }

    const assets = Array.from(portfolio.assets.values())
    const topPerformers = assets
      .filter(asset => asset.unrealizedPnL > 0)
      .sort((a, b) => b.unrealizedPnLPercentage - a.unrealizedPnLPercentage)
      .slice(0, 3)

    const worstPerformers = assets
      .filter(asset => asset.unrealizedPnL < 0)
      .sort((a, b) => a.unrealizedPnLPercentage - b.unrealizedPnLPercentage)
      .slice(0, 3)

    // Yeniden dengeleme ihtiyacı kontrolü
    let rebalanceNeeded = false
    for (const [symbol, targetAllocation] of portfolio.targetAllocation) {
      if (symbol === 'CASH') {
        const currentCashAllocation = (portfolio.cash / portfolio.totalValue) * 100
        if (Math.abs(targetAllocation - currentCashAllocation) > portfolio.rebalanceThreshold * 100) {
          rebalanceNeeded = true
          break
        }
      } else {
        const asset = portfolio.assets.get(symbol)
        if (asset && Math.abs(targetAllocation - asset.allocation) > portfolio.rebalanceThreshold * 100) {
          rebalanceNeeded = true
          break
        }
      }
    }

    return {
      portfolio,
      riskMetrics: {
        totalValue: portfolio.totalValue,
        totalPnL: assets.reduce((sum, asset) => sum + asset.unrealizedPnL, 0),
        totalPnLPercentage: assets.reduce((sum, asset) => sum + asset.unrealizedPnLPercentage, 0),
        maxDrawdown: Math.min(...assets.map(asset => asset.unrealizedPnLPercentage)),
        sharpeRatio: 0, // Basitleştirilmiş
        volatility: 0, // Basitleştirilmiş
        beta: 1.0,
        correlation: 0.5
      },
      topPerformers,
      worstPerformers,
      rebalanceNeeded
    }
  }

  // Tüm portföyleri al
  getAllPortfolios(): Portfolio[] {
    return Array.from(this.portfolios.values())
  }

  // Portföy al
  getPortfolio(portfolioId: string): Portfolio | null {
    return this.portfolios.get(portfolioId) || null
  }
}

export default PortfolioManager 