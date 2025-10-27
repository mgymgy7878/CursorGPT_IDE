import { build } from 'esbuild';
import { writeFileSync } from 'fs';

const external = [
  // keep native/heavy deps external at runtime
  'duckdb', 'fastify', 'prom-client', 'node-fetch', '@fastify/cors', '@fastify/websocket',
  'pino', 'pino-pretty', 'dotenv'
];

console.log('🚀 Building executor bundle with esbuild...');

const result = await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/executor.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: true,
  external,
  keepNames: true,
  legalComments: 'none',
  logLevel: 'info',
  metafile: true,
  banner: { js: '/* spark executor bundle (esbuild, no type-check) */' }
}).catch((e) => { 
  console.error('❌ Build failed:', e); 
  process.exit(1); 
});

// Write metafile for analysis
writeFileSync('dist/executor.meta.json', JSON.stringify(result.metafile, null, 2));

console.log('✅ Bundle created: dist/executor.mjs');
console.log('✅ Metafile created: dist/executor.meta.json');
