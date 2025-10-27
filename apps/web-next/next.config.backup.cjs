/** @type {import('next').NextConfig} */
const EXECUTOR_ORIGIN = process.env.EXECUTOR_ORIGIN || 'http://127.0.0.1:4001';

module.exports = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },    // ✅ TypeScript hatalarını kontrol et
  eslint: { ignoreDuringBuilds: false },       // ✅ ESLint kontrolü aktif
  
  // monorepo paketlerini SWC'ye transpile ettir
  transpilePackages: ['@spark/agents', '@spark/types', '@spark/shared'],
  experimental: { externalDir: true },
  // SSR sırasında canlı istekleri Next'e proxyle
  async rewrites() {
    return [
      { source: '/api/public/metrics/prom', destination: `${EXECUTOR_ORIGIN}/public/metrics/prom` },
      { source: '/api/futures/time',        destination: `${EXECUTOR_ORIGIN}/api/futures/time` },
      { source: '/api/public/health',       destination: `${EXECUTOR_ORIGIN}/health` },
    ];
  },
};
