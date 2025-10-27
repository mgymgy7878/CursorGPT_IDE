/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: { 
    esmExternals: "loose"
  },
  // Next'in internal paketleri transpile etmesini sağla
  transpilePackages: [], // dist tükettiğimiz için gerek yok, boş bırak
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Bazı Windows kurulumlarında dosya watcher sorunlarını azaltır
  webpack: (config) => {
    config.snapshot = { ...config.snapshot, managedPaths: [] };
    return config;
  },
  async redirects() {
    return [
      { source: '/Gozlem', destination: '/gozlem', permanent: true },
      { source: '/Ayarlar', destination: '/ayarlar', permanent: true },
      { source: '/PortfoyYonetimi', destination: '/portfoy', permanent: true },
    ];
  },
  async rewrites() {
    const EXECUTOR = process.env.EXECUTOR_ORIGIN || 'http://127.0.0.1:4001';
    return [
      {
        source: '/api/public/:path*',
        destination: `${EXECUTOR}/public/:path*`,
      },
      {
        source: '/api/public/metrics',
        destination: `${EXECUTOR}/public/metrics/prom`,
      },
      {
        source: '/api/portfolio/:path*',
        destination: `${EXECUTOR}/api/portfolio/:path*`,
      },
      {
        source: '/api/futures/:path*',
        destination: `${EXECUTOR}/api/futures/:path*`,
      },
      {
        source: '/api/positions',
        destination: `${EXECUTOR}/api/positions`,
      },
      {
        source: '/api/pnl/:path*',
        destination: `${EXECUTOR}/api/pnl/:path*`,
      },
      {
        source: '/api/ai/:path*',
        destination: `${EXECUTOR}/api/ai/:path*`,
      },
      {
        source: '/api/exchange/:path*',
        destination: `${EXECUTOR}/api/exchange/:path*`,
      },
      {
        source: '/advisor/:path*',
        destination: `${EXECUTOR}/advisor/:path*`,
      },
      {
        source: '/backtest/:path*',
        destination: `${EXECUTOR}/backtest/:path*`,
      },
      {
        source: '/optimize/:path*',
        destination: `${EXECUTOR}/optimize/:path*`,
      },
      {
        source: '/sse/:path*',
        destination: `${EXECUTOR}/sse/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
