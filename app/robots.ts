import type { MetadataRoute } from 'next'
import { siteBaseUrl } from '@/lib/ngf'

// Next auto-routes this to /robots.txt.
// Required by the SEO launch gate in NGF-STANDARDS.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: `${siteBaseUrl()}/sitemap.xml`,
  }
}
