import { build } from 'esbuild';
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/bundle.cjs',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  bundle: true,
  minify: true,
  sourcemap: false,
  banner: { js: '// executor bundle (esbuild)' },
});
console.log('[esbuild] bundle.cjs written'); 