// apps/web-next/next.config.cjs
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Monorepo için ŞART: app dışındaki paketleri izleyebil
    externalDir: true,
    esmExternals: "loose",
    serverComponentsExternalPackages: [
      "@spark/types", "@spark/exchange-binance", "@spark/guardrails",
      "@spark/execution", "@spark/agents", "@spark/backtester"
    ],
  },
  // pnpm + symlink için: iç paketleri SWC ile derle
  transpilePackages: [
    "@spark/types", "@spark/exchange-binance", "@spark/guardrails",
    "@spark/execution", "@spark/agents", "@spark/backtester"
  ],

  // ★ Standalone üret
  output: "standalone",
  // Monorepo kökü: bağımlılık izinin doğru hesaplanması için
  outputFileTracingRoot: path.join(__dirname, "../.."),

  webpack: (config) => {
    // pnpm symlink -> doğru bundle/trace
    config.resolve = config.resolve || {};
    config.resolve.symlinks = true;

    // Bazı Windows ortamlarında fs snapshot cache'i sorun çıkarıyor
    config.snapshot = { ...(config.snapshot || {}), managedPaths: [] };
    return config;
  },
};

// ★ Build log'unda bunu görmezsek Next config'i hiç okumuyor demektir.
console.log("[next.config] loaded:", __filename, "cwd=", process.cwd(), "output=", nextConfig.output);
module.exports = nextConfig;