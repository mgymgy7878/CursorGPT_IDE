export const dynamic = "force-dynamic";

export default async function OpsPublic() {
  const rescue = process.env.RESCUE_ENABLED === "1";
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">OPS • Dashboard</h1>
      <p className="mb-4">Bu sayfa her zaman açık. Gelişmiş teşhis için <code>/ops/rescue</code> kilit gerektirir.</p>
      <p className="mb-6"><b>Rescue Mode:</b> {rescue ? "RESCUE_ENABLED=1 (aktif)" : "RESCUE_ENABLED=0 (kapalı)"}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-2">Health</h3>
          <p className="text-sm muted mb-3">Sistem sağlık durumu</p>
          <a href="/api/public/health" className="btn">Detay →</a>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-2">Runtime</h3>
          <p className="text-sm muted mb-3">Executor bağlantı özeti</p>
          <a href="/api/public/runtime" className="btn">Detay →</a>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-2">Quick Metrics</h3>
          <p className="text-sm muted mb-3">Prometheus metrikleri</p>
          <a href="/api/public/metrics/prom" className="btn">Detay →</a>
        </div>
      </div>

      <details className="card p-4">
        <summary className="cursor-pointer font-medium">Metrikleri (ham) göster</summary>
        <iframe src="/api/public/metrics/prom" className="w-full h-80 border border-neutral-700 rounded-lg mt-4"/>
      </details>
    </div>
  );
}
