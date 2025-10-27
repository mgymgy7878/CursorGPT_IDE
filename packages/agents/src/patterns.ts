export function maCross(closes:number[], fast=20, slow=100){
  if (closes.length < slow+1) return { ok:false, strength:0 }
  const ma = (arr:number[], n:number)=>arr.slice(-n).reduce((a,b)=>a+b,0)/n
  const f = ma(closes, fast), s = ma(closes, slow)
  const pf = ma(closes.slice(0,-1), fast), ps = ma(closes.slice(0,-1), slow)
  const crossUp = pf<=ps && f>s
  const crossDown = pf>=ps && f<s
  const strength = Math.min(1, Math.abs(f-s)/(s||1))
  return { ok: crossUp || crossDown, strength }
}

export function rsiDiv(_closes:number[]){
  // Stub: 0..1 random-ish
  const strength = 0.3
  return { ok: strength>0.2, strength }
}

export function breakout(highs:number[], lows:number[], n=20){
  if (highs.length<n || lows.length<n) return { ok:false, strength:0 }
  const recentHigh = Math.max(...highs.slice(-n))
  const recentLow  = Math.min(...lows.slice(-n))
  const last = highs[highs.length-1]
  if (last === undefined) return { ok: false, strength: 0 }
  const ok = last>=recentHigh || last<=recentLow
  const strength = ok ? 0.5 : 0
  return { ok, strength }
} 