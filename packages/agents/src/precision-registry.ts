export type SymbolMeta = { stepSize: number; tickSize: number; minNotional: number }

// Basit in-memory registry (CI fixture üzerinden doldurulabilir)
const REGISTRY = new Map<string, SymbolMeta>()

function loadFixture(path: string) {
	try {
		// Dynamic import kullanılamıyor, geçici olarak boş bırakıyoruz
		// TODO: Build time'da dosyaları import etmek için farklı bir yöntem kullanılabilir
	} catch {}
}

// Opsiyonel fixture yüklemeleri (öncelik: Binance -> OKX -> Bybit)
loadFixture('../../data/exchanges/binance/symbols.json')
loadFixture('../../data/exchanges/okx/symbols.json')
loadFixture('../../data/exchanges/bybit/symbols.json')

export const requireRegistryInProd = () =>
	process.env.NODE_ENV === 'production' && process.env.PRECISION_FALLBACK !== 'true'

export let spark_precision_registry_hits_total = 0
export let spark_precision_registry_misses_total = 0

export function getSymbolMeta(symbol: string): SymbolMeta | undefined {
	const meta = REGISTRY.get(symbol)
	if (meta) { spark_precision_registry_hits_total++; return meta }
	spark_precision_registry_misses_total++
	return undefined
} 
