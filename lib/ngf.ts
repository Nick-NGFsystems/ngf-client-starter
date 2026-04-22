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
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return {}
    const data = (await res.json()) as { content?: NgfSiteContent }
    return data.content ?? {}
  } catch {
    return {}
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
