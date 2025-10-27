/* Early crash visibility + dynamic import */
process.on('unhandledRejection', (e:any)=>{ console.error('[BOOT][unhandledRejection]', e?.stack||e); process.exit(1); });
process.on('uncaughtException',  (e:any)=>{ console.error('[BOOT][uncaughtException]',  e?.stack||e); process.exit(1); });

(async () => {
  try {
    const HOST = process.env.HOST ?? '0.0.0.0';
    const PORT = Number(process.env.PORT ?? 4001);
    console.error('[BOOT] env', { HOST, PORT, NODE_ENV: process.env.NODE_ENV });
    // Dinamik import: index.ts içindeki import-time hataları burada yakalanır
    await import('./index.ts');
  } catch (err:any) {
    console.error('[BOOT] module import failed', err?.stack || err);
    process.exit(1);
  }
})();
