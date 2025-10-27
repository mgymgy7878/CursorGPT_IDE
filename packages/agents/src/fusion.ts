export function fuseSignals({regime, newsScore=0, newsConf=0, patternStrength=0}:{regime:string;newsScore?:number;newsConf?:number;patternStrength?:number}){
  let base = (regime==='UP_TREND'||regime==='DOWN_TREND') ? 0.6 : 0.4
  const newsBoost = newsScore*newsConf*0.3
  const patBoost  = patternStrength*0.2
  const score = Math.max(0, Math.min(1, base + newsBoost + patBoost))
  const strategy = score>=0.6 ? 'TrendFollower' : 'GridBot'
  return {score, strategy}
} 