import React, { useEffect, useState } from "react";
import { useStrategyLabStore } from "../../stores/useStrategyLabStore";

export default function SaveLoadBar() {
  const { saveRecipe, loadRecipe, listRecipes, removeRecipe, runBacktest } = useStrategyLabStore() as any;
  const [name, setName] = useState('Stratejim');
  const [items, setItems] = useState<string[]>([]);
  const [sel, setSel] = useState<string>('');

  useEffect(() => { setItems(listRecipes()); }, [listRecipes]);

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="isim" style={{ width:160 }} />
      <button className="btn" onClick={()=>{ saveRecipe(name); setItems(listRecipes()); }}>Kaydet</button>
      <select className="input" value={sel} onChange={e=>setSel(e.target.value)} style={{ width:200 }}>
        <option value="">(kayıt seç)</option>
        {items.map((k: string) => <option key={k} value={k}>{k}</option>)}
      </select>
      <button className="btn" disabled={!sel} onClick={()=>{
        if (loadRecipe(sel)) { runBacktest(); }
      }}>Yükle ve Geri Test</button>
      <button className="btn" disabled={!sel} onClick={()=>{ removeRecipe(sel); setSel(''); setItems(listRecipes()); }}>Sil</button>
    </div>
  );
} 
