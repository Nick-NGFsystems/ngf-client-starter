import type { MetadataRoute } from 'next'

// Next auto-routes this to /robots.txt.
// Required by the SEO launch gate in NGF-STANDARDS.
export default function robots(): MetadataRoute.Robots {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'example.com'
  const base = `https://${raw.replace(/^https?:\/\//, '').replace(/\/$/, '')}`

  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: `${base}/sitemap.xml`,
  }
}
