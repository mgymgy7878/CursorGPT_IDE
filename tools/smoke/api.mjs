#!/usr/bin/env node
const base = 'http://127.0.0.1:3003';

async function tryGet(u) {
  try {
    const r = await fetch(u, { cache: 'no-store' });
    const ok = r.ok;
    const data = ok ? await r.json().catch(() => ({})) : {};
    return { url: u, status: r.status, count: (data.items?.length ?? data.strategies?.length ?? 0) };
  } catch {
    return { url: u, status: 'ERR', count: 0 };
  }
}

(async () => {
  const strategiesReal = await tryGet(`${base}/api/strategies/list`);
  const strategiesMock = await tryGet(`${base}/api/public/strategies-mock`);
  const auditReal = await tryGet(`${base}/api/audit/list`);
  const auditMock = await tryGet(`${base}/api/public/audit-mock`);

  const srcStrategies = strategiesReal.status === 200 ? 'REAL' : (strategiesMock.status === 200 ? 'MOCK' : 'NONE');
  const srcAudit = auditReal.status === 200 ? 'REAL' : (auditMock.status === 200 ? 'MOCK' : 'NONE');

  console.table([
    { resource: 'strategies', source: srcStrategies, realStatus: strategiesReal.status, mockStatus: strategiesMock.status, count: strategiesReal.count || strategiesMock.count },
    { resource: 'audit', source: srcAudit, realStatus: auditReal.status, mockStatus: auditMock.status, count: auditReal.count || auditMock.count },
  ]);
  process.exit(0);
})();


