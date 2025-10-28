// Safe bootstrap for mixed ESM/TS builds
const path = require('path');
const { pathToFileURL } = require('url');

const createApp = async () => {
  // Try multiple entry points (src, dist, root)
  try {
    const srcPath = path.resolve(__dirname, './src/index.js');
    return await import(pathToFileURL(srcPath).href);
  } catch (e1) {
    try {
      const distPath = path.resolve(__dirname, './dist/index.js');
      return await import(pathToFileURL(distPath).href);
    } catch (e2) {
      try {
        const rootPath = path.resolve(__dirname, './index.js');
        return await import(pathToFileURL(rootPath).href);
      } catch (e3) {
        // Fallback to ts-node for TS files
        process.env.TS_NODE_TRANSPILE_ONLY = "1";
        require("ts-node/register/transpile-only");
        return require("./src/index.ts");
      }
    }
  }
};

createApp().then(async (mod) => {
  const appFactory = (mod.default || mod.app || mod.create || mod);
  const app = typeof appFactory === 'function' ? await appFactory() : (appFactory.app || appFactory);
  
  // App might already be listening from internal start()
  if (!app.server || !app.server.listening) {
    const port = process.env.PORT ? Number(process.env.PORT) : 4001;
    await app.listen({ port, host: '0.0.0.0' });
    console.log('[BOOT] executor listening', { port });
  }
}).catch((err) => {
  console.error('[BOOT] failed:', err);
  process.exit(1);
});
