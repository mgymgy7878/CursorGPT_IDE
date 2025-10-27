import { test, expect } from "@playwright/test"
import { getSymbolMeta, spark_precision_registry_hits_total, spark_precision_registry_misses_total } from "@spark/agents"

// @smoke-precision-fixtures
// Bu test, OKX ve Bybit fixture sembollerinin registry tarafından bulunabildiğini doğrular

test.describe('Precision fixtures — OKX/Bybit', () => {
	test('@smoke-precision-fixtures fixtures are loaded and no misses', async () => {
		const beforeHits = spark_precision_registry_hits_total
		const beforeMiss = spark_precision_registry_misses_total

		// OKX örnekleri
		const okxA = getSymbolMeta('BTC-USDT')
		const okxB = getSymbolMeta('ETH-USDT')

		// Bybit örnekleri
		const byA = getSymbolMeta('BTCUSDT')
		const byB = getSymbolMeta('ETHUSDT')

		expect(okxA).toBeTruthy()
		expect(okxB).toBeTruthy()
		expect(byA).toBeTruthy()
		expect(byB).toBeTruthy()

		const afterHits = spark_precision_registry_hits_total
		const afterMiss = spark_precision_registry_misses_total
		expect(afterHits - beforeHits).toBeGreaterThanOrEqual(4)
		expect(afterMiss - beforeMiss).toBe(0)
	})
}) 
