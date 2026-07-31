import type { MetadataRoute } from 'next'

// Next auto-routes this to /sitemap.xml. Add an entry for every public page you
// create — a page missing here is effectively invisible to Google.
// Required by the SEO launch gate in NGF-STANDARDS.
export default function sitemap(): MetadataRoute.Sitemap {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'example.com'
  const base = `https://${raw.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
  const now = new Date()

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/book`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
