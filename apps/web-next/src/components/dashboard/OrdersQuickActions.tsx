"use client";
export default function OrdersQuickActions(){
  async function dl(type:"json"|"csv"){
    const r = await fetch("/api/tools/get_orders",{ method:"POST", headers:{ "content-type":"application/json" }, body:"{}" });
    if(!r.ok) return;
    const j = await r.json().catch(()=> ({}));
    const rows = Array.isArray(j?.orders) ? j.orders : (j?.data ?? []);
    let blob: Blob; let name = type === "csv" ? "open_orders.csv" : "open_orders.json";
    if(type==="json"){
      blob = new Blob([JSON.stringify(rows,null,2)],{type:"application/json;charset=utf-8"});
    } else {
      const cols = Array.from(new Set(rows.flatMap((o:any)=>Object.keys(o||{})))) as string[];
      const esc = (v:any)=> {
        if(v==null) return "";
        const s = String(v).replaceAll('"','""');
        return `"${s}"`;
      };
      const lines = [cols.join(",")].concat(rows.map((o:any)=> cols.map((c:string)=>esc(o[c])).join(",")));
      blob = new Blob([lines.join("\n")],{type:"text/csv;charset=utf-8"});
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name; a.click(); URL.revokeObjectURL(a.href);
  }
  return (
    <div className="flex gap-2">
      <button className="btn" onClick={()=>dl("json")}>JSON indir</button>
      <button className="btn" onClick={()=>dl("csv")}>CSV indir</button>
    </div>
  );
}


