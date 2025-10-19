// Basit event bus: Optimizer → CodeEditor'a param aktarmak için
export type BestParams = { emaFast?: number; emaSlow?: number; [k:string]: any };
const KEY = "studio.bestParams";
const KEY_BASE = "studio.baseline.params";
let MEM: any = null;
export function saveBestParams(p: BestParams){
  try{ localStorage.setItem(KEY, JSON.stringify(p)); MEM = p; }catch{}
  try{ window.dispatchEvent(new CustomEvent("studio:bestParams",{ detail: p })); }catch{}
}
export function readBestParams(): BestParams | null {
  try{ if(MEM) return MEM; const s = localStorage.getItem(KEY); if(!s) return null; MEM = JSON.parse(s); return MEM; }catch{ return null; }
}
export function setBaselineParams(p: any){ try{ localStorage.setItem(KEY_BASE, JSON.stringify(p)); }catch{} }
export function getBaselineParams(): any { try{ const s = localStorage.getItem(KEY_BASE); return s? JSON.parse(s): null; }catch{ return null } }
export function getCandidateParams(): any { return readBestParams(); }
export function diffParams(candidate: any, baseline: any){
  const keys = Array.from(new Set([...(Object.keys(candidate||{})), ...(Object.keys(baseline||{}))]));
  const diff: any = {}; let changes = 0;
  for(const k of keys){
    const a = JSON.stringify(candidate?.[k]);
    const b = JSON.stringify(baseline?.[k]);
    if(a !== b){ diff[k] = { from: baseline?.[k], to: candidate?.[k] }; changes++; }
  }
  return { changes, diff };
}


