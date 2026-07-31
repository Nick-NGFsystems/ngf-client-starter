export type NgfSiteContent = Record<string, string>

function getDomain(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'localhost:3000'
  return raw.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
}

/**
 * Fetch this site's published content from the NGF portal.
 * Returns flat dot-notation key-value pairs.
 * e.g. { 'hero.headline': 'Welcome', 'services.items.0.title': 'Consulting' }
 */
export async function getNgfContent(): Promise<NgfSiteContent> {
  try {
    const domain = getDomain()
    const base = process.env.NGF_APP_URL || 'https://app.ngfsystems.com'
    const url = `${base}/api/public/content?domain=${encodeURIComponent(domain)}`
    // Time-based ISR + instant cache-bust on publish (see NGF-STANDARDS
    // "Content caching & revalidation"). NEVER use cache: 'no-store' — that
    // hits Neon on every single pageview. The portal's push handler pings this
    // site's /api/revalidate on publish, which busts this cache immediately.
    const res = await fetch(url, { next: { revalidate: 60, tags: ['ngf-content'] } })
    if (!res.ok) return {}
    const data = (await res.json()) as { content?: NgfSiteContent }
    return data.content ?? {}
  } catch {
    return {}
  }
}

/**
 * The NGF public API base + this site's domain, for the booking widget (which
 * calls the public availability/bookings endpoints from the browser). Read on
 * the server and passed into the client widget as props.
 */
export function ngfEndpoints(): { base: string; domain: string } {
  return {
    base: process.env.NGF_APP_URL || 'https://app.ngfsystems.com',
    domain: getDomain(),
  }
}

/**
 * Extract a dynamic array of items from flat dot-notation content.
 * e.g. getItems(content, 'services.items') returns array of objects from keys like
 * 'services.items.0.title', 'services.items.1.title', etc.
 */
export function getItems(content: NgfSiteContent, prefix: string): Record<string, string>[] {
  const prefixDot = prefix + '.'
  const keys = Object.keys(content).filter(k => k.startsWith(prefixDot))
  if (keys.length === 0) return []

  const indices = new Set<number>()
  for (const key of keys) {
    const rest = key.slice(prefixDot.length)
    const idx = parseInt(rest.split('.')[0])
    if (!isNaN(idx)) indices.add(idx)
  }

  return Array.from(indices)
    .sort((a, b) => a - b)
    .map(i => {
      const itemPrefix = `${prefixDot}${i}.`
      const item: Record<string, string> = {}
      for (const key of keys) {
        if (key.startsWith(itemPrefix)) {
          item[key.slice(itemPrefix.length)] = content[key]
        }
      }
      return item
    })
}
