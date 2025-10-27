import { getSymbolMeta, requireRegistryInProd } from "./precision-registry"
import type { SymbolMeta } from "./precision-registry"

export let spark_qty_rounding_corrections_total = 0
export let spark_order_rejects_total = 0

type Args = { symbol: string; weight: number; price: number; equity: number }

function roundDownToStep(value: number, step: number) { return Math.floor(value / step) * step }
function roundToTick(value: number, tick: number) { return Math.round(value / tick) * tick }

export function weightToQty({ symbol, weight, price, equity }: Args) {
	const meta = getSymbolMeta(symbol)
	if (!meta && requireRegistryInProd()) {
		spark_order_rejects_total++
		throw new Error('Unknown symbol metadata (prod requires registry)')
	}
	const m: SymbolMeta = meta ?? { stepSize: 0.0001, tickSize: 0.01, minNotional: 10 }
	let notional = equity * weight
	let qty = roundDownToStep(notional / price, m.stepSize)
	const p = roundToTick(price, m.tickSize)
	if (qty * p < m.minNotional) {
		const adj = roundDownToStep(Math.ceil((m.minNotional / p) / m.stepSize) * m.stepSize, m.stepSize)
		if (adj !== qty) { spark_qty_rounding_corrections_total++; qty = adj }
	}
	if (qty <= 0) { spark_order_rejects_total++; throw new Error('Qty rounded to zero') }
	return { qty, price: p }
} 