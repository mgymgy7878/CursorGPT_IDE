"use client";
export default function TradesTable({rows}:{rows:{t:number; side:'BUY'|'SELL'; price:number; qty:number}[]}) {
  return (
    <div className="p-3 rounded-2xl border bg-white shadow-sm space-y-2">
      <div className="font-semibold">Trades</div>
      <div className="max-h-64 overflow-auto border rounded">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50 sticky top-0">
            <tr><th className="p-2 text-left">time</th><th className="p-2 text-left">side</th><th className="p-2 text-left">price</th><th className="p-2 text-left">qty</th></tr>
          </thead>
          <tbody>
            {(rows||[]).map((r,i)=>(
              <tr key={i} className="odd:bg-white even:bg-neutral-50/40">
                <td className="p-2">{new Date(r.t).toLocaleString()}</td>
                <td className="p-2">{r.side}</td>
                <td className="p-2">{r.price}</td>
                <td className="p-2">{r.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 