import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yhmcvpgffabfqqggddht.supabase.co'
const supabaseHostname = new URL(supabaseUrl).hostname
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const appHostname = new URL(appUrl).hostname

// Content Security Policy — strict but functional
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://connect-js.stripe.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://${supabaseHostname} https://lh3.googleusercontent.com https://*.stripe.com`,
  `font-src 'self' data:`,
  `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname} https://api.stripe.com https://*.groq.com https://*.inngest.com`,
  `frame-src 'self' https://js.stripe.com https://connect-js.stripe.com https://hooks.stripe.com`,
  `frame-ancestors 'none'`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Standalone output for Docker/production deployments
  ...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
        ],
      },
    ]
  },
};

export default nextConfig;
