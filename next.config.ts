/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-inline'/'unsafe-eval' are required by Next.js runtime chunks.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              // app.ngfsystems.com is required for BROWSER-side calls to the NGF
              // public API (the booking widget). getNgfContent() is a server-side
              // fetch and is NOT governed by CSP.
              "connect-src 'self' https://app.ngfsystems.com https://www.google-analytics.com https://*.googletagmanager.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              // Lets the NGF portal editor embed this site for live preview.
              "frame-ancestors 'self' https://app.ngfsystems.com https://*.vercel.app",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

// If this site adds Clerk, Stripe, a map embed, or any third-party script, you
// MUST extend the CSP above (script-src / connect-src / frame-src). Clerk on a
// production key also serves from a custom subdomain (clerk.<your-domain>) that
// *.clerk.com does NOT cover — see NGF-STANDARDS "Security baseline".
module.exports = nextConfig
