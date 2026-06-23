/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Security: disable source maps in production builds ──
  productionBrowserSourceMaps: false,

  // ── Security: remove "X-Powered-By: Next.js" header ──
  poweredByHeader: false,

  async headers() {
    // Security headers applied to every route
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];

    return [
      // ── Global security headers for all pages ──
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          // Default: deny framing (overridden for /embed below)
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },

      // ── Widget: cross-origin loading ──
      {
        source: "/widget.js",
        headers: [
          ...securityHeaders,
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },

      // ── Embed page: allow framing ──
      {
        source: "/embed",
        headers: [
          ...securityHeaders,
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },

      // ── API routes: CORS for embedded widget ──
      {
        source: "/api/:path*",
        headers: [
          ...securityHeaders,
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
