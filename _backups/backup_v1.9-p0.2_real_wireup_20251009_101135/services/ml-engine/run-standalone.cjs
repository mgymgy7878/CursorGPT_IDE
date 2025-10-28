// ML Engine Standalone Runner (CJS, Cycle-Free)
// Directly loads compiled dist/ output to avoid ESM/TS loader cycles
const path = require('path');
const { pathToFileURL } = require('url');

async function startMLEngine() {
  try {
    console.log('[ML-ENGINE] Starting standalone ML Engine...');
    
    // Try compiled output first
    const distPath = path.join(__dirname, 'dist', 'index.js');
    const distUrl = pathToFileURL(distPath).href;
    
    try {
      const mod = await import(distUrl);
      const startFn = mod.default || mod.start;
      
      if (typeof startFn === 'function') {
        await startFn();
        console.log('[ML-ENGINE] ✅ Started successfully');
      } else {
        console.error('[ML-ENGINE] ❌ No start function found in module');
        process.exit(1);
      }
    } catch (buildErr) {
      console.warn('[ML-ENGINE] Compiled dist not found, trying ts-node fallback...');
      
      // Fallback to ts-node (dev mode)
      process.env.TS_NODE_TRANSPILE_ONLY = '1';
      require('ts-node/register/transpile-only');
      
      const srcPath = path.join(__dirname, 'src', 'index.ts');
      const mod = require(srcPath);
      const startFn = mod.default || mod.start;
      
      if (typeof startFn === 'function') {
        await startFn();
        console.log('[ML-ENGINE] ✅ Started successfully (ts-node)');
      } else {
        console.error('[ML-ENGINE] ❌ No start function found');
        process.exit(1);
      }
    }
  } catch (err) {
    console.error('[ML-ENGINE] ❌ Failed to start:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

startMLEngine();

