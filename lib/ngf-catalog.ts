import { siteDomain } from '@/lib/ngf-order'

/**
 * The product catalog — CANONICAL. Byte-identical on every NGF site.
 *
 * Do not hand-edit. What a business sells, and what it charges, is owned by the
 * CLIENT in their portal (Products), fetched here at request time.
 *
 * ── This file is the OPPOSITE of the `||` fallback rule, on purpose ──────────
 *
 * Every other loader on an NGF site falls back: `content['hero.headline'] ||
 * 'Welcome'`, because a hero with no headline should still render something.
 * lib/ngf-store.ts falls back to zeroes, because charging no postage is a
 * recoverable mistake.
 *
 * A CATALOG MUST NOT. A product, price or category that is shown but does not
 * exist is worse than an empty shelf, because a customer can try to buy it. So
 * everything here FAILS CLOSED:
 *
 *  - An unreachable portal renders an empty shelf, never a stale one. There is
 *    no bundled fallback catalog anywhere in this file to fall back TO.
 *  - An item that cannot be priced EXACTLY is dropped, not shown.
 *  - unitPriceCents() returns null rather than guessing, and the checkout
 *    refuses the whole order on null rather than dropping a line.
 *
 * ── Money ───────────────────────────────────────────────────────────────────
 *
 * INTEGER CENTS, never a display string. The model this replaced stored '$39'
 * and 'From $39' and recovered a number with a regex at charge time, which is
 * how a card advertised one price while the checkout took another. Money is a
 * number here and becomes a string only at render.
 *
 * ── The browser never sends a price ─────────────────────────────────────────
 *
 * getCatalog() runs on the SERVER. The cart holds ids, option labels and
 * quantities; the server re-prices every line from this catalog before it
 * charges. That is what lets a client edit prices in their portal without the
 * browser being trusted with one.
 */

export type Cents = number

export interface CatalogVariant {
  /** Shown on the selector pill: '16"', 'Engraved', '7"'. */
  label: string
  priceCents: Cents
}

export interface CatalogProduct {
  /** The stable public id the cart and the checkout key on. */
  id: string
  name: string
  /** 'piece' | 'bundle' today; a service menu adds its own. */
  kind: string
  category: string
  /** Client-defined attribute list — metals, materials, whatever they sell by. */
  tags: string[]
  description: string
  image: string
  images?: string[]
  /** A single price. Mutually exclusive with `variants`. */
  priceCents?: Cents
  variants?: CatalogVariant[]
  /** Heading above the selector — 'Length', 'Size', 'Style'. */
  variantLabel?: string
  comparePriceCents?: Cents
  badge?: string
  customizable?: boolean
}

// ── Loading ──────────────────────────────────────────────────────────────────

const isPositiveCents = (c: unknown): c is Cents =>
  typeof c === 'number' && Number.isInteger(c) && c > 0

const asString = (v: unknown): string => (typeof v === 'string' ? v : '')

const asStringList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

/**
 * Turn one untrusted wire object into a product, or null.
 *
 * The portal already drops anything unsellable before it answers. This checks
 * again anyway: a site that renders whatever arrives is one bad deploy, one
 * half-written migration or one wrong domain away from advertising a price it
 * cannot charge. The cost of checking twice is nothing; the cost of not
 * checking is a customer at a broken payment step.
 */
function parseProduct(raw: unknown): CatalogProduct | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Record<string, unknown>

  const id = asString(x.id).trim()
  const name = asString(x.name).trim()
  if (!id || !name) return null

  const rawVariants = Array.isArray(x.variants) ? x.variants : []
  const variants: CatalogVariant[] = []
  for (const v of rawVariants) {
    if (!v || typeof v !== 'object') return null
    const vx = v as Record<string, unknown>
    const label = asString(vx.label).trim()
    // One unpriceable option makes the WHOLE product unsafe to show: a shopper
    // would pick it and be refused at checkout. Drop the product, not the row.
    if (!label || !isPositiveCents(vx.priceCents)) return null
    variants.push({ label, priceCents: vx.priceCents })
  }

  // Duplicate labels make a line's price ambiguous — the charge is looked up by
  // label. Refuse rather than pick one.
  const seen = new Set<string>()
  for (const v of variants) {
    if (seen.has(v.label)) return null
    seen.add(v.label)
  }

  const product: CatalogProduct = {
    id,
    name,
    kind: asString(x.kind) || 'piece',
    category: asString(x.category),
    tags: asStringList(x.tags),
    description: asString(x.description),
    image: asString(x.image),
  }

  const images = asStringList(x.images)
  if (images.length > 0) product.images = images

  if (variants.length > 0) {
    product.variants = variants
    const variantLabel = asString(x.variantLabel).trim()
    if (variantLabel) product.variantLabel = variantLabel
  } else if (isPositiveCents(x.priceCents)) {
    product.priceCents = x.priceCents
  } else {
    // Neither a single price nor a priced option: nothing here can be charged.
    return null
  }

  if (isPositiveCents(x.comparePriceCents)) product.comparePriceCents = x.comparePriceCents
  const badge = asString(x.badge).trim()
  if (badge) product.badge = badge
  if (x.customizable === true) product.customizable = true

  return product
}

/**
 * Read this site's catalog from the portal.
 *
 * THE ONLY SEAM. No module should read products any other way, so that where a
 * catalog comes from stays one function's worth of change.
 *
 * ISR-cached for 60s with a tag, exactly like getNgfContent() — hitting the
 * portal on every product-page render would put an external service on the
 * critical path of a sale. The portal pings this site's /api/revalidate when
 * the client saves, which busts it immediately.
 *
 * NEVER THROWS, and never returns something it made up. Every failure — no
 * domain configured, a non-200, malformed JSON, an unreachable portal — is an
 * empty array, which every surface renders as an empty shelf.
 */
export async function getCatalog(): Promise<CatalogProduct[]> {
  try {
    const base = process.env.NGF_APP_URL || 'https://app.ngfsystems.com'
    const domain = siteDomain()
    if (!domain) return []

    const res = await fetch(
      `${base}/api/public/products?domain=${encodeURIComponent(domain)}`,
      { next: { revalidate: 60, tags: ['ngf-catalog'] } },
    )
    if (!res.ok) return []

    const json = (await res.json()) as { products?: unknown }
    if (!Array.isArray(json.products)) return []

    return json.products
      .map(parseProduct)
      .filter((p): p is CatalogProduct => p !== null)
  } catch {
    return []
  }
}

export function findProduct(catalog: CatalogProduct[], id: string): CatalogProduct | undefined {
  return catalog.find((p) => p.id === id)
}

// ── Pricing ──────────────────────────────────────────────────────────────────

/**
 * The exact amount to charge for one unit. Returns null — never a guess — when
 * the request does not name a real, priced option of a real product. The
 * checkout refuses the WHOLE order on null rather than dropping the line,
 * because a dropped line undercharges without telling anyone.
 */
export function unitPriceCents(
  product: CatalogProduct,
  variantLabel?: string | null,
): Cents | null {
  if (product.variants && product.variants.length > 0) {
    // A product with options has no single price, so an unnamed option is a
    // refusal rather than a fall back to the cheapest.
    if (!variantLabel) return null
    const match = product.variants.find((v) => v.label === variantLabel)
    return match ? match.priceCents : null
  }
  // An option was named for a product that has none.
  if (variantLabel) return null
  return product.priceCents ?? null
}

export function formatCents(cents: Cents): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`
}

/** Cheapest and priciest option, by value — never by array position. */
export function priceRange(product: CatalogProduct): { min: Cents; max: Cents } | null {
  const prices = (product.variants ?? []).map((v) => v.priceCents)
  if (prices.length === 0) return null
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

/**
 * What a card shows. 'From $39' for a range, '$79' for a single price, and null
 * when there is nothing honest to show — callers render no price rather than a
 * placeholder. A range is a MARKETING LABEL and is never chargeable; only
 * unitPriceCents() produces an amount.
 */
export function displayPrice(product: CatalogProduct): string | null {
  const range = priceRange(product)
  if (range) {
    return range.min === range.max ? formatCents(range.min) : `From ${formatCents(range.min)}`
  }
  return product.priceCents ? formatCents(product.priceCents) : null
}

// ── Taxonomy, DERIVED ────────────────────────────────────────────────────────
//
// Filters are computed from the products actually present and never declared.
// A site that hardcodes its categories ends up advertising stock it has never
// had — one shipped a "soon" badge next to six materials it did not stock.

/** Categories actually present, alphabetical. */
export function categoriesInCatalog(products: CatalogProduct[]): string[] {
  return [...new Set(products.map((p) => p.category).filter(Boolean))].sort()
}

/** Tags actually present across the catalog, alphabetical. */
export function tagsInCatalog(products: CatalogProduct[]): string[] {
  return [...new Set(products.flatMap((p) => p.tags))].sort()
}

/**
 * Shared by every grid and filter bar on a site so they cannot disagree about
 * what matches. An empty selection means "no filter", not "nothing".
 */
export function filterProducts(
  products: CatalogProduct[],
  tags: Set<string>,
  categories: Set<string>,
): CatalogProduct[] {
  return products.filter((p) => {
    const tagMatch =
      tags.size === 0 ||
      [...tags].some((t) => p.tags.some((x) => x.toLowerCase() === t.toLowerCase()))
    const categoryMatch =
      categories.size === 0 ||
      [...categories].some((c) => p.category.toLowerCase() === c.toLowerCase())
    return tagMatch && categoryMatch
  })
}
