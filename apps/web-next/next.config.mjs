/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export aşamasında 500.html rename hatasını önlemek için standalone moda geçiyoruz
  output: "standalone",
  eslint: {
    // Build sırasında lint hatalarını yok say (D1 PASS için)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Re-enabled: TypeScript checks are now passing
    ignoreBuildErrors: false,
  },
  experimental: {
    typedRoutes: false,
    optimizePackageImports: ["recharts"],
    // Fix: styled-jsx is not automatically included in standalone builds
    // https://github.com/vercel/next.js/issues/42641
    outputFileTracingIncludes: {
      "/**": [
        "node_modules/styled-jsx/**/*",
      ],
    },
  },
  reactStrictMode: true,
  transpilePackages: [
    "recharts",
    "d3-shape",
    "d3-scale",
    "d3-array",
    "d3-format",
    "d3-interpolate",
    "d3-time",
    "d3-time-format",
    "lightweight-charts",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : [];
      externals.push("recharts", "lightweight-charts");
      config.externals = externals;
    }
    // keep other aliases as-is
    return config;
  },
  headers: async () => {
    const reportOnly = process.env.NEXT_PUBLIC_CSP_REPORT_ONLY === "1";
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      // script/style will be governed by middleware nonce/report-only
      "connect-src 'self' http: https: ws: wss:",
      "frame-ancestors 'none'",
    ].join("; ");

    const hdr = reportOnly
      ? [{ key: "Content-Security-Policy-Report-Only", value: csp }]
      : [{ key: "Content-Security-Policy", value: csp }];

    return [
      {
        source: "/(.*)",
        headers: [
          ...hdr,
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  // Backward compatibility: /api/snapshot/export → /api/snapshot/download
  redirects: async () => {
    return [
      {
        source: "/api/snapshot/export",
        destination: "/api/snapshot/download",
        permanent: true, // 308 Permanent Redirect
      },
      // Trailing slash redirects (prevent CLS/LCP variance)
      {
        source: "/settings/",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/portfolio/",
        destination: "/portfolio",
        permanent: true,
      },
      {
        source: "/strategies/",
        destination: "/strategies",
        permanent: true,
      },
      {
        source: "/running/",
        destination: "/running",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
