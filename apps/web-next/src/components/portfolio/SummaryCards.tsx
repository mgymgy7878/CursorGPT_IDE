"use client";
export default function SummaryCards({
  totalUsd,
  accountCount,
  updatedAt,
}: {
  totalUsd: number;
  accountCount: number;
  updatedAt?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card title="Toplam Portföy (USD)">
        ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </Card>
      <Card title="Bağlı Hesap">
        {accountCount}
      </Card>
      <Card title="Son Güncelleme">
        {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
      </Card>
    </div>
  );
}

function Card({ title, children }:{title:string; children:React.ReactNode}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{title}</div>
      <div className="mt-1 text-xl font-semibold">{children}</div>
    </div>
  );
}
