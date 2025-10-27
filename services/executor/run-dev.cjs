// Safe bootstrap for ESM/TS with ts-node/esm loader
const path = require('path');
const { pathToFileURL } = require('url');

const createApp = async () => {
  // Try compiled JS first (dist or src)
  try {
    const distPath = path.resolve(__dirname, './dist/index.js');
    return await import(pathToFileURL(distPath).href);
  } catch (e1) {
    try {
      const srcPath = path.resolve(__dirname, './src/index.js');
      return await import(pathToFileURL(srcPath).href);
    } catch (e2) {
      // Fallback to ts-node/esm for TS files
      process.env.TS_NODE_TRANSPILE_ONLY = "1";
      const tsPath = path.resolve(__dirname, './src/index.ts');
      
      // Use --loader for ESM mode
      const { spawn } = require('child_process');
      const child = spawn(process.execPath, [
        '--loader', 'ts-node/esm',
        '--experimental-specifier-resolution=node',
        tsPath
      ], {
        stdio: 'inherit',
        env: process.env
      });
      
      child.on('exit', (code) => process.exit(code || 0));
      
      // Keep process alive
      return new Promise(() => {});
    }
  }
};

createApp().then(async (mod) => {
  if (!mod) return; // ts-node/esm spawned separate process
  
  const appFactory = (mod.default || mod.app || mod.create || mod);
  const app = typeof appFactory === 'function' ? await appFactory() : (appFactory.app || appFactory);
  
  // App might already be listening from internal start()
  if (app && (!app.server || !app.server.listening)) {
    const port = process.env.PORT ? Number(process.env.PORT) : 4001;
    await app.listen({ port, host: '0.0.0.0' });
    console.log('[BOOT] executor listening', { port });
  }
}).catch((err) => {
  console.error('[BOOT] failed:', err);
  process.exit(1);
});
