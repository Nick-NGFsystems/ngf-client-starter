import type { MetadataRoute } from 'next'
import { siteBaseUrl } from '@/lib/ngf'

// Next auto-routes this to /sitemap.xml. Add an entry for every public page you
// create — a page missing here is invisible to Google AND to the portal editor,
// which discovers your pages from this file (see NGF-STANDARDS, "The scraper
// reads every page in your sitemap.xml"). Required by the SEO launch gate.
//
// The base comes from siteBaseUrl() — the same fallback chain the content
// lookup uses — never from a hand-rolled default. If this site has dynamic
// routes (app/**/[slug]/page.tsx), make this function async and map over the
// same content source the route reads; `npm run doctor` fails otherwise.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl()
  const now = new Date()

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/book`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
