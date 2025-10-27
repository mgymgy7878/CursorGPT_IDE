// @ts-check
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { 
    externalDir: true,
    esmExternals: "loose"
  },
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: [
    "@spark/types", "@spark/exchange-binance", "@spark/guardrails",
    "@spark/execution", "@spark/agents", "@spark/backtester"
  ],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.symlinks = true;
    config.snapshot = { ...(config.snapshot || {}), managedPaths: [] };
    return config;
  },
};

// ★ Build log'unda bunu görmezsek Next config'i hiç okumuyor demektir.
console.log("[next.config] loaded:", __filename, "cwd=", process.cwd(), "output=", nextConfig.output);

export default nextConfig;

