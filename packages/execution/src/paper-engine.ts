type Side = 'BUY'|'SELL'
export class PaperEngine {
  positions = new Map<string, { side: Side; qty: number; entry: number }>()
  place(symbol: string, side: Side, qty: number, price: number) {
    this.positions.set(symbol, { side, qty, entry: price }); return { orderId: `paper_${Date.now()}` }
  }
  closeAll(symbol: string, price: number) {
    const p = this.positions.get(symbol); if (!p) return { pnl: 0 }
    const pnl = p.side==='BUY' ? (price - p.entry)*p.qty : (p.entry - price)*p.qty
    this.positions.delete(symbol); return { pnl }
  }
} 