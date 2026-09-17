export type NgfSiteContent = Record<string, string>

/**
 * The host this site is served on, from ONE fallback chain that every
 * consumer shares: NEXT_PUBLIC_SITE_URL, else the Vercel production URL, else
 * localhost. sitemap.ts and robots.ts used to keep their own chain ending in
 * 'example.com', and two live sites shipped sitemaps under that host for weeks
 * because the env var was never set on their Vercel project. Use `||`, not
 * `??`: a blank env var (easy to create in the Vercel UI) must fall through.
 */
function rawSiteHost(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'localhost:3000'
  return raw.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function getDomain(): string {
  return rawSiteHost().replace(/^www\./, '')
}

/**
 * Absolute public base URL for sitemap.ts, robots.ts, metadataBase and JSON-LD:
 * `https://acme.com`, `https://acme-mockup.vercel.app`, or `http://localhost:3000`.
 * Never 'example.com'. Keeps `www.` if the env var has it — this is the URL
 * search engines get, so it must be the host visitors actually land on.
 */
export function siteBaseUrl(): string {
  const host = rawSiteHost()
  return host.startsWith('localhost') ? `http://${host}` : `https://${host}`
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

/**
 * One photo in a `gallery` field. `alt` is '' when the client wrote none;
 * exactly one photo in a non-empty list has `cover: true` — the one the client
 * chose, or the first.
 */
export interface NgfPhoto {
  src: string
  alt: string
  cover: boolean
}

/**
 * Parse the gallery wire format (mirrors lib/gallery-field.ts in the NGF app):
 * a JSON array whose entries are a bare URL string or `{ src, alt?, cover? }`.
 * Never throws; `[]` for anything missing, empty or malformed.
 */
function parseNgfGallery(raw: unknown): NgfPhoto[] {
  if (typeof raw !== 'string' || raw.trim() === '') return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Tolerate a bare URL stored before this field type existed.
    return raw.includes('[') ? [] : [{ src: raw.trim(), alt: '', cover: true }]
  }
  if (!Array.isArray(parsed)) return []

  const out: NgfPhoto[] = []
  let coverSeen = false
  for (const entry of parsed) {
    if (typeof entry === 'string') {
      if (entry.trim() !== '') out.push({ src: entry.trim(), alt: '', cover: false })
      continue
    }
    if (!entry || typeof entry !== 'object') continue
    const o = entry as { src?: unknown; alt?: unknown; cover?: unknown }
    if (typeof o.src !== 'string' || o.src.trim() === '') continue
    const cover = o.cover === true && !coverSeen
    if (cover) coverSeen = true
    out.push({
      src: o.src.trim(),
      alt: typeof o.alt === 'string' ? o.alt.trim() : '',
      cover,
    })
  }
  if (out.length > 0 && !coverSeen) out[0].cover = true
  return out
}

/**
 * Read a `gallery` field as photos — src, alt text and which one is the cover.
 *
 * A `data-ngf-group` path must be exactly two segments and item sub-fields are
 * flat scalars, so `products.items.0.photos.0` cannot be expressed — a per-item
 * image LIST is impossible as a group. The gallery type encodes the list as JSON
 * inside a single field instead, so it declares like any other sub-field.
 *
 * Usage — always pass your hardcoded fallback, same contract as `||`. The
 * fallback may be plain URLs or full photos; the first is the cover unless one
 * says otherwise:
 *
 *   const photos = getGalleryPhotos(content, `homes.items.${i}.photos`, home.photos)
 *
 * Annotate the CONTAINER, not the images, give it exactly one child per photo
 * (the bridge grows the list by cloning the last child) and render every
 * photo's alt — the editor writes it:
 *
 *   <div data-ngf-field={`homes.items.${i}.photos`}
 *        data-ngf-label="Photos" data-ngf-type="gallery" data-ngf-section="Homes">
 *     {photos.map((p, n) => <div key={n}><img src={p.src} alt={p.alt} /></div>)}
 *   </div>
 *
 * Never throws; returns `fallback` (normalised) for missing, empty or malformed
 * values.
 */
export function getGalleryPhotos(
  content: NgfSiteContent,
  key: string,
  fallback: Array<string | { src: string; alt?: string; cover?: boolean }> = [],
): NgfPhoto[] {
  const stored = parseNgfGallery(content[key])
  if (stored.length > 0) return stored
  return parseNgfGallery(JSON.stringify(fallback))
}

/** The URLs of a `gallery` field, in order. Use getGalleryPhotos for alt text. */
export function getGallery(
  content: NgfSiteContent,
  key: string,
  fallback: string[] = [],
): string[] {
  return getGalleryPhotos(content, key, fallback).map((p) => p.src)
}

/**
 * The one photo to show where only one fits — a card on a listing page, a
 * project thumbnail, a share image. The client picks it in the editor's Photos
 * sheet ("Set as cover"); without a pick it is the first photo. `fallback` is
 * the hardcoded URL for a gallery with nothing stored.
 *
 *   <img src={getCover(content, `homes.items.${i}.photos`, home.photos[0])} alt={home.name} />
 */
export function getCover(content: NgfSiteContent, key: string, fallback: string): string {
  const photos = parseNgfGallery(content[key])
  return photos.find((p) => p.cover)?.src ?? fallback
}
