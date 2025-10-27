/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: { externalDir: true },
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false }
};
module.exports = nextConfig;
