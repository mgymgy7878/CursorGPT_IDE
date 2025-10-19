export function SMA(src:number[], n:number){ 
  const out:number[]=[]; 
  let s=0; 
  for(let i=0;i<src.length;i++){ 
    s+=src[i]; 
    if(i>=n) s-=src[i-n]; 
    out.push(i>=n-1?s/n:NaN);
  } 
  return out; 
}

export function EMA(src:number[], n:number){ 
  if(!Array.isArray(src)||src.length===0) throw new Error('invalid_input'); 
  const k=2/(n+1); 
  let ema=src[0]; 
  const out:number[]=[+ema.toFixed(6)]; 
  for(let i=1;i<src.length;i++){ 
    ema=src[i]*k+ema*(1-k); 
    out.push(+ema.toFixed(6)); 
  } 
  return out; 
}

export function RSI(src:number[], n:number){ 
  const out:number[]=[]; 
  let up=0, dn=0; 
  for(let i=1;i<src.length;i++){ 
    const ch=src[i]-src[i-1]; 
    const u=Math.max(ch,0), d=Math.max(-ch,0); 
    up=(up*(n-1)+u)/n; 
    dn=(dn*(n-1)+d)/n; 
    const rs=dn===0?100:up/dn; 
    out.push(i<n?NaN:100-100/(1+rs)); 
  } 
  return [NaN,...out]; 
}

export function ATR(h:number[], l:number[], c:number[], n:number){ 
  const tr:number[]=[]; 
  for(let i=0;i<c.length;i++){ 
    const prev=i>0?c[i-1]:c[i]; 
    tr.push(Math.max(h[i]-l[i], Math.abs(h[i]-prev), Math.abs(l[i]-prev))); 
  } 
  return EMA(tr,n); 
}

export function FIB(high:number, low:number){ 
  const H=Math.max(high,low), L=Math.min(high,low); 
  const r=H-L, lvls=[0,0.236,0.382,0.5,0.618,0.786,1]; 
  return lvls.map(l=>({ratio:l, price:+(H-r*l).toFixed(2)})); 
}

export function BB(src:number[], n:number=20, mult:number=2){ 
  if(!Array.isArray(src)||src.length<n) throw new Error(`Need >= ${n} closes`); 
  const out:{u:number;m:number;l:number}[]=[]; 
  let s=0; 
  for(let i=0;i<src.length;i++){ 
    s+=src[i]; 
    if(i>=n) s-=src[i-n]; 
    if(i>=n-1){ 
      const m=s/n; 
      let sq=0; 
      for(let j=i-n+1;j<=i;j++) sq+=(src[j]-m)*(src[j]-m); 
      const std=Math.sqrt(sq/n); 
      out.push({u:+(m+mult*std).toFixed(2), m:+m.toFixed(2), l:+(m-mult*std).toFixed(2)}); 
    }else{ 
      out.push({u:NaN,m:NaN,l:NaN}); 
    } 
  } 
  return out; 
}

export function BB_ROLLING(src:number[], n:number=20, mult:number=2){ 
  if(!Array.isArray(src)||src.length<n) throw new Error(`Need >= ${n} closes`); 
  const out:{u:number;m:number;l:number}[]=[]; 
  const q:number[]=[]; 
  let mean=0, m2=0; 
  for(let i=0;i<src.length;i++){ 
    const x=src[i]; 
    q.push(x); 
    const k1=q.length; 
    const delta=x-mean; 
    mean+=delta/k1; 
    m2+=delta*(x-mean); 
    if(q.length>n){ 
      const old=q.shift()!; 
      const len=q.length; 
      let mu=0; 
      for(let j=0;j<len;j++) mu+=q[j]; 
      mu/=len; 
      let s2=0; 
      for(let j=0;j<len;j++){ const d=q[j]-mu; s2+=d*d; } 
      mean=mu; m2=s2; 
    } 
    if(q.length>=n){ 
      const variance=m2/n; 
      const std=Math.sqrt(variance); 
      out.push({u:+(mean+mult*std).toFixed(2), m:+mean.toFixed(2), l:+(mean-mult*std).toFixed(2)}); 
    }else{ 
      out.push({u:NaN,m:NaN,l:NaN}); 
    } 
  } 
  return out; 
}

export function MACD(src:number[], fast=12, slow=26, signal=9){ 
  if(src.length<slow+signal) throw new Error('insufficient_data'); 
  const ef=EMA(src,fast); 
  const es=EMA(src,slow); 
  const macd=ef.map((v,i)=>+(v-es[i]).toFixed(6)); 
  const sig=EMA(macd.slice(slow-1),signal); 
  const paddedSignal=Array(slow-1).fill(NaN).concat(sig); 
  const histogram=macd.map((v,i)=>+(v-(paddedSignal[i]??NaN)).toFixed(6)); 
  return {macd,signal:paddedSignal,histogram}; 
}

export function STOCH(high:number[], low:number[], close:number[], kPeriod=14, dPeriod=3){ 
  if([high,low,close].some(a=>!Array.isArray(a)||a.length===0)) throw new Error('invalid_input'); 
  if(high.length!==low.length||low.length!==close.length) throw new Error('length_mismatch'); 
  const n=close.length; 
  const k:number[]=new Array(n).fill(NaN); 
  for(let i=0;i<n;i++){ 
    if(i<kPeriod-1) continue; 
    let hh=-Infinity,ll=Infinity; 
    for(let j=i-kPeriod+1;j<=i;j++){ if(high[j]>hh)hh=high[j]; if(low[j]<ll)ll=low[j]; } 
    const denom=hh-ll; 
    k[i]=denom===0?0:+(((close[i]-ll)/denom)*100).toFixed(2); 
  } 
  const d:number[]=new Array(n).fill(NaN); 
  for(let i=0;i<n;i++){ 
    if(i<kPeriod-1+dPeriod-1) continue; 
    let s=0; for(let j=i-dPeriod+1;j<=i;j++) s+=k[j]; 
    d[i]=+(s/dPeriod).toFixed(2); 
  } 
  return {k,d}; 
}

