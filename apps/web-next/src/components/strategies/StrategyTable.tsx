"use client";
import { Strategy } from "@/types/strategy";
import RowActions from "./RowActions";

export default function StrategyTable({ rows, onChange }: { rows: Strategy[]; onChange: () => void }) {
  return (
    <div className="overflow-auto rounded-2xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900/40">
          <tr>
            {["Ad", "Sembol", "Durum", "Oluşturma", "İşlemler"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="px-4 py-2">{s.name}</td>
              <td className="px-4 py-2 font-mono">{s.symbol}</td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 rounded-lg text-xs
                  ${
                    s.status === "running"
                      ? "bg-green-100 text-green-700"
                      : s.status === "error"
                      ? "bg-red-100 text-red-700"
                      : s.status === "draft"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {s.status}
                </span>
              </td>
              <td className="px-4 py-2">{new Date(s.createdAt).toLocaleString()}</td>
              <td className="px-4 py-2">
                <RowActions strategy={s} onChange={onChange} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
