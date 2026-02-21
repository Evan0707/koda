import type { MetadataRoute } from 'next'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kodaflow.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/onboarding/',
          '/pay/',
          '/quote/',
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
