const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const targets = {
  ui: 'http://127.0.0.1:3003/api/public/ping',
  api: 'http://127.0.0.1:4001/health'
};

async function ping(url) {
  const res = await fetch(url, { cache: 'no-store' });
  return res.ok;
}

(async () => {
  const arg = process.argv[2] || 'all';
  const keys = arg === 'all' ? ['ui', 'api'] : [arg];
  const results = await Promise.all(
    keys.map((k) => ping(targets[k]).then((ok) => [k, ok]))
  );
  const failed = results.filter(([, ok]) => !ok);
  results.forEach(([k, ok]) => console.log(k.toUpperCase(), ok ? 'OK' : 'FAIL'));
  process.exit(failed.length ? 1 : 0);
})();
