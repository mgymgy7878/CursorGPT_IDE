export type Wrapped<T> = { _schema?: number; data: T };

export function getJSON<T>(key: string, def: T, schema?: number): T {
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return def;
    const j = JSON.parse(raw);
    if(schema == null){
      return j?.data !== undefined ? (j.data as T) : (j as T);
    }
    if(typeof j?._schema === 'number'){
      if(j._schema === schema) return (j.data as T);
      return def;
    }
    return def;
  }catch{
    return def;
  }
}

export function setJSON<T>(key: string, val: T, schema?: number){
  try{
    if(schema == null){
      localStorage.setItem(key, JSON.stringify(val));
      return;
    }
    const wrap: Wrapped<T> = { _schema: schema, data: val };
    localStorage.setItem(key, JSON.stringify(wrap));
  }catch{}
}

export function mergeJSON<T>(key: string, incoming: T[], selectKey: (x: T)=>string, schema?: number){
  try{
    const cur: T[] = getJSON<any>(key, [], schema);
    const map = new Map<string, T>();
    for(const r of cur){ map.set(selectKey(r), r); }
    for(const r of incoming){ const k = selectKey(r); if(!map.has(k)) map.set(k, r); }
    const out = Array.from(map.values());
    setJSON<any>(key, out, schema);
    return out;
  }catch{ return []; }
}


