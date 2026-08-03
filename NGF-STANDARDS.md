# NGFsystems — Universal Project Standards

<!-- ngf-standards-version: 2.5.0 -->
**Version 2.5.0 · last updated 2026-08-03.** AI sessions fetch this file from a raw URL — check this line first; if your copy is older than the canonical one, re-fetch before relying on it.

> **2.5.0** closes the cookie-consent gaps. `NEXT_PUBLIC_COOKIE_ANALYTICS` was documented only in prose,
> so a site could gate GA4 behind consent correctly and still have the banner never render — consent never
> granted, analytics silently never loading. It is now in `.env.local.example`, stated as an invariant, and
> enforced by the doctor. Added `resetCookieConsent()` so a visitor can change their mind: previously the
> banner appeared once and the first click was permanent, which is not a lawful consent flow.
>
> **2.4.0** adds the rule that has now bitten three sessions: **verify the remote before editing any
> existing client repo.** One live client folder had no `.git` at all while a public repo of the same
> name existed and was ahead of it — every edit went into a disconnected copy while the live site kept
> serving old code. The doctor now fails a missing `.git` or missing remote. Also fixed: the feature
> playbook's contact-form recipe told you to build the bespoke Resend-only route that the lead-capture
> standard forbids, and the honeypot naming rule is now enforced (a honeypot named `company` gets
> autofilled by real users, silently discarding their enquiry).
>
> **2.3.0** makes the document self-sufficient. The files it could only *describe* — the 43 KB editor
> bridge, `LeadForm`, `CookieConsent`, the doctor — are now fetched by **`npm run sync-ngf`**, so the doc
> contains a command instead of an instruction to go find them. The bridge exports `NGF_BRIDGE_VERSION`
> and `sync-ngf --check` fails on drift, which retires the copy-paste model that left 7 of 9 live sites
> on a stale bridge.
>
> **2.2.0** closed the gaps found by building sites from this document alone, with the starter repo
> withheld. Both blockers were things the doc never stated: the **binding meta tag** (mentioned once, in
> a troubleshooting table — without it a site can never be attached to a client) and the fact that the
> **scraper reads only the homepage**. Added "This document is not self-contained", "Binding markers",
> consent-gated GA4, and a `NEXT_PUBLIC_SITE_URL` format rule the doc previously contradicted itself on.

**This is the canonical foundation document for every NGF client website.** Fork/copy from `ngf-client-starter`, follow the rules below, and any site you build will plug into the NGF portal editor on day one.

> **Two commands decide whether a site is actually compliant** — don't rely on reading this doc alone:
> - `npm run doctor` in the site repo — mechanical conformance check (see "Verifying a site").
> - **Admin → Ecosystem** in the portal — live end-to-end proof that the site is really bound to its client panel.

> **No client or project names appear in this file by design.** Standards are universal; concrete examples use neutral placeholders (e.g. `Acme Co`). Real per-project notes belong in that project's own `CLAUDE.md`, never here.

## Contents

- [Single source of truth](#single-source-of-truth) · [**This document is not self-contained**](#this-document-is-not-self-contained--files-you-must-fetch) — **read first**: files you must clone from `ngf-client-starter`
- [How to use this file](#how-to-use-this-file) · [How we work](#how-we-work--cowork-mode)
- [Tech stack](#tech-stack)
- [NGF Portal Editor Integration](#ngf-portal-editor-integration--the-foundation) — the foundation (required files, `lib/ngf.ts`, caching, bridge, annotation patterns, pitfalls)
- [**Binding markers**](#binding-markers--how-the-portal-decides-a-site-is-an-ngf-site) — what makes a site attachable to a client account at all
- [Setup checklist for a new site](#setup-checklist-for-a-new-ngf-client-website) · [**Verifying a site**](#verifying-a-site--dont-trust-check) — `npm run doctor` + Admin → Ecosystem
- [Site lifecycle — launch, domain changes, recovery](#site-lifecycle--launch-domain-changes-and-recovery) — **read before changing any live site's domain**
- [Local development](#local-development--never-deploy-to-test)
- [SEO & analytics](#seo--analytics--required-on-every-ngf-client-site) · [Google Business Profile](#google-business-profile--per-client-local-seo-setup)
- [Database](#database--only-if-the-site-needs-its-own-data) · [Auth](#auth--only-if-the-site-needs-it) · [Security baseline](#security-baseline--required-on-every-ngf-site)
- [Lead capture](#lead-capture-persist-first-email-second) — `<LeadForm>` / `relayLeadToNgf`, and the client's Form Submissions inbox
- [Accessibility](#accessibility--required-on-every-client-site) — WCAG 2.1 AA · [Error monitoring & uptime](#error-monitoring--uptime--how-we-find-out-before-the-client-does)
- [Design system](#design-system--universal-rules--per-client-aesthetic) · [Universal interaction patterns](#universal-interaction-patterns)
- [Absolute rules](#absolute-rules--never-break) · [Known issues / quick reference](#known-issues--quick-reference)
- [Adding or integrating a feature — the playbook](#adding-or-integrating-a-feature--the-playbook) — when a client asks for something new (blog / shop / booking / form / map / login / …)
- [Roadmap (planned standards)](#roadmap--planned-standards-not-yet-built) · [Reference implementation](#reference-implementation) · [Workflow](#workflow--how-we-build-a-feature) · [Deployment checklist](#deployment-checklist-vercel)

## Single source of truth

**This file lives in exactly one place:**

```
ngf-client-starter/NGF-STANDARDS.md  (main branch)
```

Served via the raw GitHub URL:
```
https://raw.githubusercontent.com/Nick-NGFsystems/ngf-client-starter/main/NGF-STANDARDS.md
```

It sits in the **starter** — the same public repo `npm run sync-ngf` pulls the canonical integration
files from — so one anonymous-readable repo serves everything a new site needs. It previously lived in
`NGF-Systems-app`; that repo is now private, and any link pointing there is dead. Update it.

**No client repo carries a local copy.** Every AI session fetches the URL on startup (per the user's global `~/.claude/CLAUDE.md`). Edits happen here only — there's nothing to sync, nothing to drift. If the canonical URL is ever unreachable, that's a fail-loud condition, not a fallback opportunity.

**Beware stale local checkouts.** Several client repos still have a 604-line `NGF-STANDARDS.md` **on
disk in local working copies**, left over from before the local copies were removed. It is gone from
those repos on GitHub — but a session working in a stale checkout will read it, and its only unique
content is the **withdrawn** instruction to copy `NgfEditBridge.tsx` "from a current reference site",
which is what left 7 of 9 live sites on a drifted bridge.

So: **an `NGF-STANDARDS.md` inside a client repo is always wrong.** Check its length — if it isn't the
canonical 2200+ lines with a `ngf-standards-version` marker at the top, ignore it entirely and fetch the
raw URL. Never treat a repo-local copy as authoritative, and never commit a new one.

The companion integration files — the bridge, `lib/ngf.ts`, `LeadForm`, `CookieConsent` and the doctor — have a single canonical home in the **`ngf-client-starter`** repo, and are pulled in with **`npm run sync-ngf`** rather than copied by hand. Never hand-author your own, never copy from an arbitrary existing site (they drift), and never hand-edit a synced file. See "This document is not self-contained" above.

## This document is not self-contained — run `sync-ngf` to get the rest

**Do this before writing any code.** Several files are required on every NGF site and their source is
**not** in this document — they are too large to inline, and reconstructing them from prose produces
something that looks right and fails silently. **Never hand-write or hand-edit them.** Fetch them:

```bash
# In a repo forked from ngf-client-starter (the script is already there):
npm run sync-ngf
```

In any other repo, bootstrap the script first. This form uses only Node, so it is
identical on macOS, Linux, Git Bash and PowerShell — **use it rather than `curl`**,
which PowerShell aliases to `Invoke-WebRequest` and which rejects the usual flags:

```bash
node -e "const f=require('fs');fetch('https://raw.githubusercontent.com/Nick-NGFsystems/ngf-client-starter/main/scripts/sync-ngf.mjs').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text()}).then(t=>{f.mkdirSync('scripts',{recursive:true});f.writeFileSync('scripts/sync-ngf.mjs',t)})" && node scripts/sync-ngf.mjs
```

That writes every canonical file into place and prints what changed. Then:

```bash
npm run sync-ngf:check   # verify nothing has drifted — exits non-zero if it has
```

### What it syncs

| File | Mode | What it does | Cost of a hand-rolled version |
|---|---|---|---|
| `components/NgfEditBridge.tsx` | canonical | click-to-edit, live preview, group add/remove/reorder | **Worst failure in the system.** The sidebar populates regardless (the portal scrapes raw HTML, not your bridge), so a stub looks fully wired and every click does nothing. Reads to the client as "the editor is broken." |
| `scripts/ngf-doctor.mjs` | canonical | the mechanical launch gate | No conformance check; nothing catches the rest of this list |
| `components/LeadForm.tsx` | canonical | lead capture posting to the central store | Enquiries silently lost, or honeypot mis-built and spam floods through |
| `components/CookieConsent.tsx` | canonical | consent gate + `hasCookieConsent()` | Analytics fire before consent — a compliance problem, not a bug |
| `lib/ngf.ts` | canonical | `getNgfContent` / `getItems` / `ngfEndpoints` | Also reproduced verbatim in this doc; either source is safe |
| `lib/ngf-lead.ts` | canonical | `relayLeadToNgf()` for retrofit sites | Existing forms never reach the client's inbox |
| `app/api/revalidate/route.ts` | canonical | instant publish; must fail closed | Publishes take 60s, or the endpoint fails **open** |
| `scripts/sync-ngf.mjs` | canonical | this script (it updates itself) | — |
| `app/privacy/page.tsx` | **once** | privacy policy, content-driven | Written only if absent — it imports your layout components, so it is yours to adapt |

**canonical** = byte-identical on every NGF site, always overwritten, verified by `--check`. A hand-edit
here is a bug. **once** = a starting point, written only when missing, never overwritten.

### Why this exists rather than "copy it from the starter"

The bridge was copied per-site for two years. An audit of 9 live sites found **7 running a stale copy**,
from 9.9 KB to 38.6 KB against a ~43 KB canonical — each broken differently, none detectably. The bridge
now exports `NGF_BRIDGE_VERSION`, `npm run doctor` reads it, and `sync-ngf --check` fails CI on drift.

### If the sync command fails

```bash
node scripts/sync-ngf.mjs --from=../ngf-client-starter   # offline, from a local clone
NGF_SYNC_TOKEN=<token> npm run sync-ngf                  # if the starter is private
node scripts/sync-ngf.mjs --ref=<tag|sha>                # pin to a specific version
```

> **If you cannot obtain these files, stop and say so.** Do not reconstruct them from the descriptions in
> this document. Report which files you could not get and hand back a scaffold that is explicitly
> incomplete. An honest "I need the starter repo" is a good outcome; a plausible-looking bridge that
> silently does nothing is the worst one.

**You also need a client brief.** This document is universal by design and deliberately carries no
business facts. Business name, NAP (name/address/phone), hours, staff, services, brand colours,
photography, GA4 measurement ID and the real domain must all come from the client. **Never invent them** —
fabricated NAP data ends up in JSON-LD and is published to Google as fact. Without a brief, use obvious
placeholders and list what is missing.

## Before you edit ANY existing client repo

**A folder on disk is not the source of truth. Verify the remote first — every time.**

```bash
git remote -v          # no output, or "not a git repository"? STOP and read below.
git fetch origin && git status -sb
```

This has bitten three separate sessions. Two failure modes, both silent:

- **Stale clone.** Local `main` is many commits behind `origin/main` (one was **55 behind**). You then
  "fix" things fixed months ago, and re-add files that were deliberately deleted.
- **Detached snapshot.** The folder has **no `.git` at all**, while a live public repo of the same name
  exists and is *ahead* of it. Every edit goes into a disconnected copy; the live site keeps serving the
  old code, and nothing you do reaches production.

Rules:

1. **No `.git`? Check GitHub for a repo of the same name before touching anything.** If one exists, this
   folder is a detached snapshot. Clone the real repo and work there.
2. **Never `git init` an existing client folder.** It forks or clobbers a live repo. `npm run doctor`
   fails on a missing `.git` or a missing remote for exactly this reason.
3. **Never `git reset --hard`** in these folders — they routinely hold uncommitted work.
4. **Diff before assuming either side wins.** A detached folder may hold real work that was never pushed,
   *and* be missing work that was. Compare, don't guess.
5. Always `git pull` before the first edit, and report the divergence count.

## How to use this file

At the start of any new NGF client-website session, paste:
> "I'm starting a new NGFsystems client website. Read NGF-STANDARDS.md and follow it exactly. Run `sync-ngf` to fetch the canonical integration files — do not reconstruct them from the doc."

Two scopes are covered here:

1. **Universal client-site standards** — apply to every NGF client website. Most of this file.
2. **NGF main-app standards** — apply only to `NGF-Systems-app` itself (the admin portal at `app.ngfsystems.com`). Marked clearly. Most client sites can ignore them.

For the main app's internal architecture (admin/portal routing, schema scraping pipeline, push API, version history, security invariants) read [`NGF-Systems-app/CLAUDE.md`](https://github.com/Nick-NGFsystems/NGF-Systems-app/blob/main/CLAUDE.md).

---

## How we work — Cowork mode

NGF projects are built in Claude Cowork mode. Claude has direct access to the codebase via mounted workspace folders and a sandboxed Linux shell — it reads, writes, and runs commands directly.

**Workflow rules:**
- Read this file plus the project's own `CLAUDE.md` (if present) at the start of every coding session
- Check if a component, function, or route already exists before creating anything new
- Verify writes by reading the file back
- Run `npm run build` or `npx tsc --noEmit` to confirm no TS errors before pushing
- Flag problems early — never silently skip a step or assume it'll work

**Pushing code:**
```bash
# Push EVERYTHING that differs from remote (use only when you're certain the
# whole working tree is clean):
python3 github-push.py <repo-name> "<commit message>"

# Push ONLY specific files (the safe default — append an explicit file list):
python3 github-push.py <repo-name> "<commit message>" path/to/file1 path/to/file2
```
The portable version of `github-push.py` resolves the repo dynamically — no hardcoded session paths, works from any Cowork session or your local machine. Credentials live in `github-push-config.json` next to the script.

**Always pass an explicit file list unless you have just verified the working tree is clean.** The no-filter form walks the entire local tree and pushes every file whose bytes differ from the remote blob — which includes (a) phantom CRLF/LF churn on files nobody edited, (b) other people's uncommitted in-progress work sitting in the tree, and (c) any stray non-code files in the repo (a misplaced `.docx`, `.xlsx`, `.env` backup, etc. — the script's ignore list is only `.git`, `node_modules`, `.next`, `.vercel`, `.env`, `.env.local`). Listing the exact files you changed makes the commit reviewable and keeps unrelated noise — and secrets — out of the repo. This isn't hypothetical: a blanket push from a dirty tree has swept in line-ending churn across 20+ files and personal documents before.

---

## Tech stack

### Client websites (all sites except `NGF-Systems-app`)

**Use the latest stable** of these. Client sites are independent Vercel projects and don't share dependencies with the main app.

Two things to know before you take "latest stable" literally:

- **The portal-editor contract is version-agnostic.** It is HTTP + HTML + `postMessage` — a `GET` for content, regex-scraped `data-ngf-*` attributes, and a `postMessage` protocol. None of it couples to a React or Next API, so a client site on a newer Next/React/Tailwind satisfies the contract fine.
- **But `ngf-client-starter` pins its own Next version**, so a fresh fork is *not* automatically on latest. Bump it deliberately after forking, and re-run `npm run doctor` + a real build.
- **Do not enable Partial Prerendering (PPR) on an NGF client site.** The schema scraper does one `fetch()` and regex-parses the returned HTML. If the initial shell ships placeholders where the annotated elements should be, the scraper finds nothing, silently falls back to a minimal Brand+Hero schema, and the client just sees most of their fields missing from the editor — with no error anywhere.
- **Turbopack is fine on client sites.** The "never use Turbopack" rule below applies to `NGF-Systems-app` only. Next 16 uses Turbopack by default and NGF client sites are happy on it — the editor contract is HTML + `postMessage` and does not care which bundler produced the HTML.
- **`next lint` was removed in Next 16.** The starter still ships `"lint": "next lint"` because it is pinned to Next 15. If you bump a fork to 16, that script breaks. Replace it with ESLint directly (`"lint": "eslint ."`, plus an `eslint.config.mjs` flat config), or drop it — `npm run doctor` and `tsc --noEmit` are the gates that actually matter here. Do not leave a `lint` script that errors; it makes CI output useless.

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js App Router | latest (16.x is fine; some sites still on 15.x) |
| Runtime | React | matches Next.js (18 or 19) |
| Language | TypeScript | always, never plain JS |
| Styling | Tailwind CSS | latest (3 or 4) |
| Database | Neon Postgres | only if the site needs its own data |
| ORM | Drizzle (preferred) or Prisma | choice depends on site needs |
| Email | Resend | for contact forms / transactional |
| Animations | Framer Motion | optional |
| Validation | Zod | for any form/API input |
| Deployment | Vercel | one project per client site |

### NGF main app (`NGF-Systems-app` only — pinned)

| Layer | Tool | Version |
|---|---|---|
| Next.js | App Router | **latest patch of the 15.5.x line** — not 16 yet (see below) |
| React | | **18.x** (upgrading to 19 is optional, not blocked) |
| Prisma | | **5.x** — major upgrades are a scheduled project, not incidental |
| Clerk | `@clerk/nextjs` | **v6** — never `@latest` (v7 has breaking JWT changes) |
| Tailwind | | **3.x** (3.4.19 is the v3-LTS head and still gets security patches) |

**Never use Turbopack.** **Never use `npx prisma`** — always `./node_modules/.bin/prisma`. These rules apply to the main app only; client sites with Drizzle don't care.

#### Pin to a *supported* version, not a frozen one

**Pinning a hub app is correct. Pinning it to a minor upstream has stopped patching is not.** Vercel patches only the **latest minor of a supported major** — earlier minors of 15.x never receive the fix. So `15.3.8` is not "stable", it's *abandoned*: it sits behind every security wave since Jan 2026, including a **High-severity App Router middleware/proxy bypass** (`GHSA-267c-6grr-h53f`, affects ≥15.2.0, fixed in 15.5.18) that lets a crafted segment-prefetch URL resolve a page **without matching a middleware rule**.

The rule is therefore: **pin to the latest patch of a supported minor**, and re-check quarterly. Concretely — move `15.3.8 → 15.5.x`, and note **Next 15 reaches EOL 2026-10-21**, so the Next 16 migration is a scheduled project, not an optional one.

Two corrections to earlier revisions of this doc:

- **"React 19 is incompatible with Next 15" is false.** `next@15.3`, `15.5` and `16.x` all declare `react: "^18.2.0 || ^19.0.0"` as a peer. Next 15 is the release that *adopted* React 19. The React version is a separate, optional migration — **it does not block a Next upgrade.**
- **Staying on React 18 does not protect you from RSC vulnerabilities.** Next bundles its own `react-server-dom-*` runtime for the App Router, so RSC exposure tracks the **Next.js** version, not the declared `react` version.

#### Security patching cadence (required)

Upstream now ships security releases roughly monthly. Unpatched-by-default is not a strategy.

- **Monthly:** run `npm audit` on the main app and every actively-maintained client site. Check the Next.js releases feed.
- **Immediately:** any advisory rated High or Critical that is in-range for a version we run → patch within the week. Framework middleware/auth bypasses are always in this bucket.
- **Quarterly:** review every pinned major against its support window. Record the decision (upgrade now / defer with a date) so a pin never silently becomes abandonware.
- **Never** pin a dev dependency to the literal string `"latest"` — it is non-reproducible and maximizes supply-chain blast radius. Pin a range and commit the lockfile.
- **Defense in depth over version luck:** never let a single framework mechanism (e.g. middleware) be the only thing enforcing authorization — see Security baseline § 6.

---

## NGF Portal Editor Integration — the foundation

**This is the part that makes a website an NGF site.** Every client website ships with the integration on day one so the client can edit content from the portal at `app.ngfsystems.com`.

### Architecture in one paragraph

The site renders content with hardcoded fallbacks. At SSR time, every page calls `getNgfContent()` which fetches the client's published content from the NGF portal's public API as a flat dot-notation map. Each editable element renders `content['key'] || hardcoded_fallback` so missing keys gracefully fall through. Every editable element is annotated with `data-ngf-*` attributes so the portal editor can scrape the live HTML, build its sidebar schema dynamically, and route click-to-edit through a small bridge component (`NgfEditBridge`) that sits in `app/layout.tsx`. **There is no schema file to maintain.** The site itself is the schema.

> **The scraper reads the homepage and nothing else.** It performs a single `fetch()` of the site root
> and parses that one document. It does not crawl. **Anything annotated only on a sub-page is invisible
> to the editor** — the client will never see that field, and the failure is silent (no error, the
> section simply doesn't appear). So: put every editable section on `/`, and have sub-pages re-render
> the same components against the same canonical field paths. A `/services` page that is the *only*
> place `services.items` is annotated produces an empty editor.

### Required files for any new NGF client site

```
app/
  layout.tsx          ← Mount NgfEditBridge + call getNgfContent() once
  sitemap.ts          ← every public route (SEO launch gate — hard blocker)
  robots.ts           ← points at the sitemap (hard blocker)
  api/revalidate/     ← MUST actually call revalidatePath, and fail CLOSED

lib/
  ngf.ts              ← getNgfContent(), getItems(), ngfEndpoints() (copy verbatim)
  ngf-lead.ts         ← relayLeadToNgf() — only needed when retrofitting a site
                        that already has its own form route

components/
  NgfEditBridge.tsx   ← Bridge to the portal editor. NEVER hand-edited —
                        run `npm run sync-ngf`; exports NGF_BRIDGE_VERSION
  LeadForm.tsx        ← the standard form. New sites use this and have NO form API
                        route of their own

next.config.{js,ts}   ← CSP frame-ancestors header + the security-header baseline
vercel.json           ← ignoreCommand so docs-only commits don't burn a build
scripts/ngf-doctor.mjs ← conformance checker; `npm run doctor` must exit 0
```

### `lib/ngf.ts` — copy this verbatim

> Reproduced below **byte-for-byte from `ngf-client-starter/lib/ngf.ts`**. If you change
> that file, update this block in the same commit — a stale copy here means every site
> built from this doc is subtly wrong. (It was: this block previously omitted
> `ngfEndpoints()`, which `LeadForm` and `BookingWidget` both import, so a site built by
> following the doc literally would not compile.)

```typescript
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
```

### Content caching & revalidation — required

**Never ship `cache: 'no-store'` in `getNgfContent()`.** Every uncached SSR render hits the NGF content API, which hits Neon. For content that changes maybe once a week, that burns Neon compute on every single pageview. The standard is time-based ISR plus instant cache-busting on publish — two layers that combine to give both freshness and near-zero database load.

**Layer 1 — tagged, revalidating fetch** (already baked into the canonical `lib/ngf.ts` above):

```typescript
const res = await fetch(url, { next: { revalidate: 60, tags: ['ngf-content'] } })
```

Pages serve from cache and refresh at most once per 60 seconds. Neon sees roughly one request per minute per page instead of one per visitor.

**Layer 2 — `/api/revalidate` endpoint on every client site** — busts the cache the instant a client clicks "Push to Website" so they never wait out the 60s window to see their own change:

```typescript
// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('secret') !== process.env.WEBSITE_REVALIDATION_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  // Version-agnostic: revalidatePath('/', 'layout') busts every page under the
  // root layout, so all pages calling getNgfContent() rebuild on next request.
  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true, revalidated: true })
}
```

> **Why `revalidatePath('/', 'layout')` and not `revalidateTag`?** The tagged fetch in `lib/ngf.ts` still tags content `'ngf-content'`, but `revalidateTag`'s signature has shifted across Next versions (newer Next expects a second argument), so a bare `revalidateTag('ngf-content')` can silently no-op or throw depending on the version a site is on. `revalidatePath('/', 'layout')` is stable across Next 14/15/16 and busts exactly the pages that read NGF content. Use it as the default.

**Shared secret** — set `WEBSITE_REVALIDATION_SECRET` on the client site's Vercel project to the **same value** as `WEBSITE_REVALIDATION_SECRET` on the NGF main app. The NGF push handler (`app/api/portal/website/push/route.ts`) reads its own copy and calls `https://<site_url>/api/revalidate?secret=<secret>` on every publish. Mismatched secrets → the endpoint 401s and the site falls back to the 60s window (still correct, just not instant).

**How the two layers combine:**

| Scenario | What happens |
|---|---|
| Client publishes via portal | Push handler pings `/api/revalidate` → `revalidatePath('/', 'layout')` → next request rebuilds from fresh content. Sub-second. |
| `WEBSITE_REVALIDATION_SECRET` unset or mismatched | No ping (or 401). Content still refreshes within 60s via ISR. |
| Normal visitor traffic | Served from the ISR cache. Neon hit at most once per 60s per page. |

This is the single highest-leverage change for Neon cost: a busy client site drops from one Neon query per pageview to one per minute per page.

**Migrating an existing site off `cache: 'no-store'`:** update its `lib/ngf.ts` fetch to the tagged/revalidating form above, add `app/api/revalidate/route.ts`, set `WEBSITE_REVALIDATION_SECRET` in Vercel, redeploy. No portal-side change needed — the push handler already pings every site that has a `site_url` set.

### `components/NgfEditBridge.tsx` — synced, never hand-written

The bridge is a moving target — its postMessage contract changes when the editor adds new features (image fields, repeatable group reorder, etc.). **Always copy the latest from the single canonical source:**
- [`ngf-client-starter/components/NgfEditBridge.tsx`](https://github.com/Nick-NGFsystems/ngf-client-starter)

**Do not write a new bridge from scratch, do not copy it from an arbitrary existing client site, and do not hand-edit it.** Run **`npm run sync-ngf`**. The bridge exports `NGF_BRIDGE_VERSION`; `npm run doctor` reads it and `npm run sync-ngf:check` fails when it drifts from canonical. When the editor's contract changes, the starter's bridge is the one place that gets updated and every site re-syncs. The bridge contract is documented in the NGF main app `CLAUDE.md`.

> **Status:** the starter's bridge **is** current (it holds the latest contract including the image overlay controls). Copy it from there — the older instruction to copy from "the most recently-shipped production site" is withdrawn; production copies have drifted badly (an audit of 9 sites found 7 running a stale bridge, ranging from 9.9 KB to 38.6 KB against the canonical ~40 KB).

### `app/layout.tsx` — required pattern

```tsx
import type { Metadata } from 'next'
import NgfEditBridge from '@/components/NgfEditBridge'
import { getNgfContent } from '@/lib/ngf'

export const metadata: Metadata = {
  title: 'Client Site',
  description: '',
  // REQUIRED — this is how the portal recognizes an NGF site. See below.
  other: {
    'ngf-public-api': 'https://app.ngfsystems.com/api/public/content',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getNgfContent()
  return (
    <html lang="en">
      <body>
        {/* pass `content` down through layout components; every page
            also calls getNgfContent() in its own server component */}
        {children}
        <NgfEditBridge />
      </body>
    </html>
  )
}
```

> **Do not omit the `other` block.** It renders `<meta name="ngf-public-api" …>`, which is one of the
> binding markers below. Without a marker, `PATCH /api/admin/portal/[clientId]/config` returns **422**
> and the client's `site_url` can never be set — and `site_url` is the only string joining a portal
> account to a website. No binding means no content, no editor schema, and a permanently red
> Ecosystem check, with nothing in the UI explaining why. Verify with View Source after deploy.

### Binding markers — how the portal decides a site is "an NGF site"

Before writing `site_url`, the admin fetches the site root and does a **raw substring match** on the
returned HTML. At least one of these must appear:

| Marker | Where it comes from |
|---|---|
| `data-ngf-field` | any annotated editable field |
| `data-ngf-group` | any annotated repeatable group |
| `ngf-public-api` | the `metadata.other` block above |
| `app.ngfsystems.com/api/public/content` | the content API referenced in client-side code |
| `app.ngfsystems.com/api/public/website` | legacy path |
| `ngfsystems.com/api/public` | any other public API reference |

Canonical list: `lib/ngf-site-markers.ts` in the NGF app — the bind gate, `/api/admin/verify-ngf-site`,
and the Ecosystem health check all import it, so they cannot drift apart.

**The trap:** `getNgfContent()` is a *server-side* fetch. The content API URL never reaches the browser,
so a perfectly working content integration produces **none** of the URL markers on its own. A fully
annotated site is bindable via `data-ngf-field`; a site with the meta tag is bindable before a single
field is annotated. Ship the meta tag and you are covered in both directions.

### `next.config.{js,ts}` — required CSP header

The portal editor loads each client site inside an iframe. Without this header the browser blocks embedding:

```typescript
async headers() {
  return [{
    source: '/:path*',
    headers: [{
      key: 'Content-Security-Policy',
      value: "frame-ancestors 'self' https://app.ngfsystems.com https://*.vercel.app",
    }],
  }]
}
```

### Required env vars

```
NEXT_PUBLIC_SITE_URL   # MUST match client_configs.site_url in the NGF database
                       # exactly (after normalizing protocol/www/trailing slash)
NGF_APP_URL            # Optional. Defaults to https://app.ngfsystems.com
WEBSITE_REVALIDATION_SECRET
                       # Shared secret — set to the SAME value as on the NGF main
                       # app. Lets the portal's "Push to Website" bust this site's
                       # content cache instantly via /api/revalidate. If unset, the
                       # site still refreshes within 60s via ISR (see Content
                       # caching & revalidation).
```

If `NEXT_PUBLIC_SITE_URL` doesn't match the client_configs row, the portal can't deliver content and the site renders only hardcoded fallbacks.

> **Write it as a bare hostname — no protocol, no `www.`, no trailing slash.**
> ✅ `NEXT_PUBLIC_SITE_URL=acme.com`  ✅ `acme-mockup.vercel.app`  ❌ `https://acme.com/`
>
> `getNgfContent()` normalizes the value before sending it, so a protocol *happens* to survive the
> content lookup — but `sitemap.ts`, `robots.ts`, `metadataBase` and the JSON-LD builders all
> interpolate it as `` `https://${raw}` ``. With a protocol in the var you ship `https://https://acme.com`
> into your sitemap and canonical tags, which is invisible locally and breaks indexing in production.
> Always guard those interpolations with a strip, exactly as the starter does:
>
> ```ts
> const raw  = process.env.NEXT_PUBLIC_SITE_URL || 'example.com'
> const base = `https://${raw.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
> ```
>
> Use `||`, not `??` — an env var that exists but is **blank** (easy to create in the Vercel UI) passes
> straight through `??` and yields `https://`.

### Self-describing markup — annotation patterns

Every editable element needs **all four** attributes. The scraper silently drops any element missing `data-ngf-label` or `data-ngf-section`.

#### Scalar text field

```tsx
<h1
  data-ngf-field="hero.headline"
  data-ngf-label="Headline"
  data-ngf-type="text"
  data-ngf-section="Hero"
>
  {content['hero.headline'] || 'Build the home you\'ve always dreamed of.'}
</h1>
```

#### Textarea field

```tsx
<p
  data-ngf-field="hero.description"
  data-ngf-label="Description"
  data-ngf-type="textarea"
  data-ngf-section="Hero"
>
  {content['hero.description'] || 'Long-form fallback paragraph.'}
</p>
```

#### Image field — use plain `<img>`, NEVER `next/image` with `fill`

The bridge swaps `src` directly. `next/image` with `fill` wraps the real img in a span the bridge can't reach.

Add `data-ngf-aspect` to lock the editor's upload cropper to a specific ratio — the client's uploaded photo is cropped to match this ratio before it ever reaches the server. Also use the `<field>_alt` convention for editable alt text so clients can describe their images for SEO and accessibility.

```tsx
<img
  src={content['hero.image'] || '/hero-default.jpg'}
  alt={content['hero.image_alt'] || 'Hero background'}
  data-ngf-field="hero.image"
  data-ngf-label="Hero Background Image"
  data-ngf-type="image"
  data-ngf-section="Hero"
  data-ngf-aspect="16:9"
  className="absolute inset-0 h-full w-full object-cover"
/>
```

**What `data-ngf-aspect` does:**

- The schema scraper picks up the aspect on every image field that has it.
- The editor's upload cropper locks to that aspect ratio — the client can pan and zoom but can't break the design by uploading a square photo into a wide hero slot.
- Format is `"W:H"` — common values: `"16:9"` (hero / banner), `"1:1"` (avatar / square card), `"3:2"` (most photos), `"4:5"` (Instagram portrait), `"2:1"` (banner).
- Omit the attribute entirely for free-form cropping (the cropper still appears, but the ratio is unlocked).

**What the `<field>_alt` convention does:**

- The editor's image-field popover always shows an alt-text input alongside the URL/upload controls.
- Whatever the client types is stored as a companion field at the same path with `_alt` appended.
- The client site reads it via `content['hero.image_alt'] || 'fallback alt'`.
- No extra annotation needed — the convention is implicit. Just use `_alt` in your fallback lookup and the editor handles the rest.
- For repeatable items: `content['team.members.0.image_alt']`, `content['team.members.1.image_alt']`, etc.

**Editor UX for image fields:**

In edit mode, the bridge automatically renders overlay controls on every annotated image (>40-60px depending on control). No client action or annotation required — this is built into `NgfEditBridge.tsx`. Three controls in total:

1. **Replace photo button** (top-right, dark, ~all images >40px) — opens the upload popover with cropper + alt text input. Available on every annotated image, not just gallery items.

2. **Delete X button** (top-left, red, only images >60px AND inside a `[data-ngf-group]`) — confirms then sends `removeGroupItem` to the editor, which removes the card. Available only on images that live in a repeatable group, since standalone images (hero, logo) have no concept of "remove."

3. **Drag-to-reorder** (cursor grab on the image itself, only images inside a `[data-ngf-group]`) — desktop drag-and-drop. Dragged image shows dimmed dashed outline, drop targets in the same group show a bold blue ring. Drop on another image in the same group → posts `moveGroupItem` to the editor. Mobile/touch: HTML5 drag doesn't fire — use the sidebar arrows instead.

All three controls reposition on scroll/resize via requestAnimationFrame so they stay glued to their images. Removed automatically when edit mode is disabled or when a card containing the image is removed. Together they solve the "managing 10-30 photos in one place is painful" problem from a client's perspective — they can replace, remove, or reorder every photo directly on the live preview without scrolling the sidebar.

Sites get the new behavior automatically when their bridge is brought up to the canonical version (currently ~40 KB, lives at `ngf-client-starter/components/NgfEditBridge.tsx`).

**Server-side image optimization (automatic):**

Every uploaded raster image (JPEG / PNG / WebP) goes through a Sharp pipeline before storage:

- Auto-rotated by EXIF (fixes sideways phone photos)
- Resized so neither side exceeds 1920px
- Converted to WebP at quality 85
- EXIF metadata stripped (smaller files, privacy)

A client uploads a 12 MB iPhone photo; the live site stores a ~250 KB WebP. **Animated GIF is the only passthrough — SVG is rasterized to WebP through Sharp** (which is also what strips any embedded `<script>`; see Security baseline § 9). The 25 MB upload limit is generous because optimization handles the size problem on the server side.

**Recommended aspect ratios by image type:**

| Image type | Recommended aspect |
|---|---|
| Full-bleed hero / banner | `16:9` or `21:9` |
| Avatar / team photo | `1:1` |
| Service card thumbnail | `3:2` or `4:3` |
| Project portfolio item | `3:2` |
| Logo (don't bother — usually doesn't need cropping) | omit attribute |
| Floor plan diagram | `4:3` |

#### Color field

Use an `sr-only` anchor span containing the live hex so the editor sidebar shows a real color swatch instead of an empty box.

```tsx
<span
  data-ngf-field="brand.primaryColor"
  data-ngf-label="Primary Color"
  data-ngf-type="color"
  data-ngf-section="Brand"
  aria-hidden="true"
  className="sr-only"
>
  {primaryColor}
</span>
```

#### Hidden / invisible-but-editable fields

Any field that's used as a JS variable (e.g. `const businessName = content['brand.businessName'] || 'Default'`) but doesn't have a visible DOM element — wrap an `sr-only` span around the value so the scraper picks it up:

```tsx
<span
  data-ngf-field="brand.businessName"
  data-ngf-label="Business Name"
  data-ngf-type="text"
  data-ngf-section="Brand"
  aria-hidden="true"
  className="sr-only"
>
  {businessName}
</span>
```

#### Repeatable groups (add/remove/reorder cards)

Put `data-ngf-group` on the container, declare each item's sub-fields in `data-ngf-item-fields`, render with indexed paths:

```tsx
<div
  data-ngf-group="services.items"
  data-ngf-item-label="Service"
  data-ngf-min-items="1"
  data-ngf-max-items="16"
  data-ngf-item-fields='[{"key":"image","label":"Photo","type":"image","aspect":"1:1"},{"key":"name","label":"Name","type":"text"},{"key":"price","label":"Price","type":"text"}]'
>
  {services.map((svc, i) => (
    <article key={i}>
      <img
        src={content[`services.items.${i}.image`] || svc.image}
        alt={svc.name}
        data-ngf-field={`services.items.${i}.image`}
        data-ngf-label="Photo"
        data-ngf-type="image"
        data-ngf-section="Services"
      />
      <h3
        data-ngf-field={`services.items.${i}.name`}
        data-ngf-label="Name"
        data-ngf-type="text"
        data-ngf-section="Services"
      >
        {content[`services.items.${i}.name`] || svc.name}
      </h3>
      <p
        data-ngf-field={`services.items.${i}.price`}
        data-ngf-label="Price"
        data-ngf-type="text"
        data-ngf-section="Services"
      >
        {content[`services.items.${i}.price`] || svc.price}
      </p>
    </article>
  ))}
</div>
```

**The published list is always complete (authoritative).** When a client edits *any* item in a group, the editor publishes the **entire materialized list** — every untouched item is backfilled from its live rendered value before publish, so the published array always contains the full set, never just the edited item. Sites may therefore treat a non-empty published array as the complete, authoritative list and render it directly:

```tsx
const items = getItems(content, 'services.items')
const display = items.length > 0 ? items : HARDCODED_DEFAULTS   // correct — items is whole
```

Do **not** try to merge a published array back over the defaults per-index (`content[i] || DEFAULTS[i]`) — that would resurrect items the client deleted. The all-or-nothing `length > 0 ? items : DEFAULTS` pattern is correct precisely because the editor never publishes a partial group.

#### Field type reference

| `data-ngf-type` | Editor input | Bridge writes to |
|---|---|---|
| `text` | single-line `<input>` | `el.textContent` |
| `textarea` | resizable `<textarea>` (auto-grow) | `el.textContent` |
| `color` | color picker + hex text | `el.textContent` |
| `image` | URL field + Upload-from-computer + preview | `el.setAttribute('src', …)` |

*(A fifth type, `toggle`, is declared in the app's `FieldType` union and handled by the bridge, but **the editor popover has no toggle control yet** — it falls through to a plain text input. **Don't use `data-ngf-type="toggle"` on a client site until that ships.** `NGF-Systems-app/CLAUDE.md` lists it as a supported value; this doc is the authority for what client sites may use.)*

#### Large galleries (10+ photos in one place)

For project portfolios, property listing photo sets, before-and-after collections, or any "lots of photos in one container" pattern, use the same repeatable-group annotation system above with three adjustments.

**Hard requirements — without these, in-preview delete and drag-reorder will silently no-op:**

- **Group path must be exactly two segments deep** (e.g. `gallery.items`, `properties.photos`, `project.gallery`). The editor's removeGroupItem/moveGroupItem functions expect `section.arrayKey` shape — nested-deeper paths like `projects.0.gallery` are not supported and the X / drag controls will fail silently. If you need a per-project gallery, use a flat naming convention like `projectAGallery.items`, `projectBGallery.items`.
- **The container element MUST carry `data-ngf-group="<section>.<array>"`** with that exact 2-segment path. Without the wrapper, the bridge's `getGroupContext()` returns null and individual photos can be edited but NOT deleted or reordered.
- **Each photo's `data-ngf-field` MUST follow the indexed pattern** `<section>.<array>.<i>.<subfield>` — e.g. `gallery.items.0.image`, `gallery.items.1.image`. Anything else and the index parsing fails.

1. **Bump `data-ngf-max-items`** to reflect realistic ceiling (50 or 100 for galleries)
2. **Keep item-fields minimal** — usually just `{key: "image", type: "image", aspect: "..."}` plus optional caption. Don't add unnecessary fields per photo; each extra sub-field doubles the sidebar height per item.
3. **Wrap the rendered grid in `<PhotoProvider>`** from `react-photo-view` (see "Universal interaction patterns") so visitors can click any photo to open a fullscreen swipeable lightbox.

**Annotation pattern:**

```tsx
import { PhotoProvider, PhotoView } from 'react-photo-view'

<section>
  <PhotoProvider>
    <div
      data-ngf-group="project.gallery"
      data-ngf-item-label="Photo"
      data-ngf-min-items="0"
      data-ngf-max-items="50"
      data-ngf-item-fields='[{"key":"image","label":"Photo","type":"image","aspect":"3:2"},{"key":"caption","label":"Caption (optional)","type":"text"}]'
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {photos.map((p, i) => (
        <PhotoView
          key={i}
          src={content[`project.gallery.${i}.image`] || p.fallbackSrc}
        >
          <img
            src={content[`project.gallery.${i}.image`] || p.fallbackSrc}
            alt={content[`project.gallery.${i}.image_alt`] || p.alt}
            data-ngf-field={`project.gallery.${i}.image`}
            data-ngf-label="Photo"
            data-ngf-type="image"
            data-ngf-section="Project Gallery"
            data-ngf-aspect="3:2"
            className="w-full h-auto object-cover rounded-lg cursor-zoom-in"
          />
        </PhotoView>
      ))}
    </div>
  </PhotoProvider>
</section>
```

**What the client gets, in plain language:**

- **Visitors** see a tidy grid; click any photo → fullscreen modal with prev/next arrows, swipe on mobile, pinch-zoom, and pan. Captions display below each image if you've set them.
- **Clients editing** see every photo with the permanent "Replace photo" overlay button. Click on any individual photo in the live preview → cropper opens → upload replacement → alt text inline → done. They never have to scroll the sidebar to swap a photo.
- **Adding a new photo:** sidebar "+ Add Photo" button at the bottom of the gallery group adds an empty slot. Then click it in the preview or sidebar to upload.
- **Reordering:** sidebar has ↑↓ arrows on each card.
- **Deleting:** × button on each card in the sidebar.

**What's polished today** (all built into the bridge — no per-site work):

- **Replace any photo** by clicking the dark "Replace photo" button in its top-right corner
- **Delete any photo** in the gallery by clicking the red X in its top-left corner — confirms, then removes the card and re-indexes the rest
- **Reorder photos** by dragging one image onto another within the same gallery — the dragged image dims, the drop target gets a blue ring, drop swaps in the new order

**Remaining UX rough edge at 30+ photos:**

- One photo upload at a time — no bulk drag-and-drop-30-files-at-once (yet)

That's tolerable for "swap a few photos occasionally" workflows. It gets painful for "upload an entire 30-photo gallery from scratch in one session." The first time a client actually hits this wall, build bulk multi-file upload. Until then, set client expectations: "to add many photos at once, expect to do it one at a time — takes maybe a minute per photo."

**Mobile note:** drag-to-reorder uses the HTML5 drag API which doesn't fire on touchscreens. Mobile clients can still replace and delete photos directly, but for reordering they need to use the sidebar's ↑↓ arrows. Future work: add long-press-and-drag handlers for touch.

**Things to avoid in large gallery annotations:**

- **Don't add captions as a required field** unless they're genuinely needed — most clients won't fill them in and the empty captions clutter the design. Mark them optional and only render if non-empty.
- **Don't omit `data-ngf-aspect`** — without it, clients upload portrait phone photos into landscape grid slots and the layout breaks. Lock the aspect to match the design.
- **Don't use `next/image` with `fill`** — same rule as everywhere else; bridge can't read/write through the wrapper. Plain `<img>`.
- **Don't annotate the `<PhotoView>` wrapper** — annotate only the `<img>` inside it. The bridge needs the actual image element for src updates.
- **Don't nest the group path deeper than 2 segments** — `project.gallery` works, `projects.0.gallery` will silently break the delete + drag controls.

**Image sizing in the grid — get this right or the editor experience suffers:**

Galleries that look fine on the public site can become hard to manage in the editor when image sizes are extreme in either direction. The editor renders the gallery at the same size the live site does (it's an iframe of the live site).

- **Too small** (e.g. 5+ columns on desktop, 60×60px thumbnails): the X delete button and Replace photo button get cramped, the drag-target highlight is barely visible, and clients squint to identify which photo is which.
- **Too large** (e.g. 1 column on desktop, full-viewport images): clients have to scroll the iframe constantly to reach later photos, making reorder via drag tedious because the target may be off-screen.

**Recommended sizing:**

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
  {photos.map((p, i) => (
    <div key={i} className="aspect-[3/2]">
      <img
        src={...}
        className="w-full h-full object-cover rounded-lg cursor-zoom-in"
        data-ngf-field={`gallery.items.${i}.image`}
        ...
      />
    </div>
  ))}
</div>
```

Key points: 2 columns on mobile (large enough to manage), 3-4 columns on desktop (enough to see ~12 photos in viewport without scrolling), explicit `aspect-[3/2]` (or whatever the `data-ngf-aspect` is — they MUST match), `object-cover` so images fill their slot uniformly. Tile size lands around 200-300px wide on desktop which is the sweet spot for the X and Replace buttons to fit comfortably.

### Critical content-rendering rules

1. **Always use `||`, never `??` for fallbacks.** Published content can include explicit `''`. `??` only catches `null`/`undefined`, so an empty value would render an empty element instead of falling through to the hardcoded default.
2. **Always provide a hardcoded fallback.** New clients have no published content — the site needs to render correctly from `lib/site-data.ts` (or wherever you keep defaults) before the first publish.
3. **Use plain `<img>` for image fields.** `next/image` with `fill` wraps the real img element so the bridge can't read or write `src`.
4. **Don't omit `data-ngf-label` or `data-ngf-section`.** The scraper silently skips elements missing either, and they won't appear in the editor sidebar.
5. **`data-ngf-section` is the human-readable label.** The grouping key is always derived from the first dot-segment of `data-ngf-field` (e.g. `hero.headline` → section key `hero`, regardless of what `data-ngf-section` says).
6. **One canonical content path per unique piece of data — never duplicate paths.** When the same logical content appears in multiple places (business name in header AND footer, phone number in nav AND contact page, etc.), every instance MUST read from the same `data-ngf-field` path and the same `content['…']` lookup. This is the single most common cause of "I edited it but only some places updated" complaints.

   **Right:**
   ```tsx
   // Top of page.tsx — single source of truth for repeated values
   const businessName = content['brand.businessName'] || 'Acme Co'
   const phone        = content['brand.phone']        || '(555) 555-0123'

   // Header
   <h1 data-ngf-field="brand.businessName" data-ngf-label="Business Name" data-ngf-type="text" data-ngf-section="Brand">
     {businessName}
   </h1>

   // Footer — SAME path, SAME constant
   <p data-ngf-field="brand.businessName" data-ngf-label="Business Name" data-ngf-type="text" data-ngf-section="Brand">
     {businessName}
   </p>
   ```

   **Wrong (creates two separate fields in the editor that don't sync):**
   ```tsx
   // Header
   <h1 data-ngf-field="brand.businessName">{content['brand.businessName'] || 'Acme Co'}</h1>
   // Footer — DIFFERENT path
   <p data-ngf-field="footer.businessName">{content['footer.businessName'] || 'Acme Co'}</p>
   ```

   Three rules of thumb:
   - One canonical path per unique piece of data. Business name is always `brand.businessName`, phone is always `brand.phone`, address is always `brand.address`. Never `footer.phone` or `contact.phone`.
   - Derive a constant once per page (`const businessName = content[...] || 'fallback'`) and reuse it everywhere the data appears.
   - Annotate every instance with the same `data-ngf-field` value. The bridge updates all matching elements in the live preview (via `querySelectorAll`), and the editor's schema scraper dedupes them to one sidebar entry. Edits in one place sync to every instance.

### Annotation pitfalls — patterns that break the editor

These are real bugs we've debugged in production sites. Each one looks plausible at first but breaks something in the editor. Avoid them.

#### One DOM element per field path. No responsive twins.

Don't render the same field as two elements with different responsive visibility, both annotated:

```tsx
// ❌ BREAKS — bridge stacks both in edit mode, el.textContent reads both
<button>
  <span className="md:hidden" data-ngf-field="nav.cta" ...>Connect</span>
  <span className="hidden md:inline" data-ngf-field="nav.cta" ...>Let's connect!</span>
</button>

// ❌ ALSO BREAKS — annotation on wrapper, two text spans inside →
// el.textContent concatenates "ConnectLet's connect!" into the cached default
<a data-ngf-field="nav.cta" ...>
  <span className="md:hidden">Connect</span>
  <span className="hidden md:inline">Let's connect!</span>
</a>

// ✅ CORRECT — one element, one annotation, one label that works at all breakpoints
<a data-ngf-field="nav.cta" ...>{ctaLabel}</a>
```

If a label genuinely needs to differ between breakpoints, render only the longer one and trust CSS truncation. Do not annotate two variants.

#### Don't spread `data-ngf-*` props onto multiple elements

```tsx
// ❌ BREAKS — same field annotated on both <p> elements, bridge reads
// the first one (the truncated mobile version) as the field value
<p className="md:hidden line-clamp-3" {...editorProps}>{shortBio}</p>
<p className="hidden md:block" {...editorProps}>{fullBio}</p>

// ✅ CORRECT — annotate only the canonical (full-text) element
<p className="md:hidden line-clamp-3">{shortBio}</p>
<p className="hidden md:block" {...editorProps}>{fullBio}</p>
```

`{...editorProps}` is convenient but easy to over-spread. Search the codebase for any helper that bundles `data-ngf-*` attributes and verify it's only applied to one DOM node per field path.

#### `data-ngf-group` goes on ONE container, not both responsive layouts

```tsx
// ❌ BREAKS — scraper finds two "process.steps" group declarations →
// editor sidebar shows two duplicate "Process Steps" sections
<div data-ngf-group="process.steps" className="hidden md:grid">...desktop cards...</div>
<div data-ngf-group="process.steps" className="md:hidden">...mobile cards...</div>

// ✅ CORRECT — declare the group ONCE (on the desktop container).
// Individual `data-ngf-field="process.steps.0.title"` annotations on
// mobile card text ARE fine — the bridge dedupes by path and updates
// all matching elements on contentUpdate, keeping mobile + desktop in sync.
<div data-ngf-group="process.steps" data-ngf-item-fields='[...]' className="hidden md:grid">...</div>
<div className="md:hidden">...mobile cards with field annotations only...</div>
```

The leaf scraper dedupes individual field annotations (first occurrence wins). The group scraper does not — every `data-ngf-group` declaration becomes a separate sidebar entry.

#### Annotate the container or one of its descendants — never both

If a wrapper has `data-ngf-field` AND a child also has `data-ngf-field` for the same path, the bridge gets confused about which one to read/write. Annotate at exactly one level.

#### Edit-mode cosmetic differences are normal

The bridge force-reveals containers hidden via `opacity-0`, `pointer-events-none`, `aria-expanded="false"`, etc. when they contain `data-ngf-field` elements — so dropdowns, accordions, and modal panels become editable without site-specific code.

Side effect: anything with state-dependent styling (e.g. a button that squares off when a dropdown below it opens) will look slightly different in the editor preview than on the live site. **This is cosmetic only.** Published content is unaffected. Don't try to fix it on the client site unless you find a way to do it via `[data-ngf-edit="true"]` selectors that gracefully degrade.

#### `el.textContent` reads ALL descendants, including hidden ones

When the bridge caches the default value of an annotated element on mount, it walks the entire subtree. So an annotated `<a>` containing two visually-hidden `<span>` children with text will cache "TextOneTextTwo" as the default. Same applies to image fields — only the annotated `<img>` itself is read for `src`. Keep annotations on leaf-ish nodes; if you must annotate a wrapper, make sure it has only one text-bearing descendant.

---

## Setup checklist for a new NGF client website

1. [ ] **Fork** [`ngf-client-starter`](https://github.com/Nick-NGFsystems/ngf-client-starter) — the canonical source for all integration files
2. [ ] **`npm run sync-ngf`** — fetches the bridge, `lib/ngf.ts`, `LeadForm`, `CookieConsent`, `ngf-lead`, `/api/revalidate` and the doctor. **Do this before writing any code, and never hand-edit what it writes.** See "This document is not self-contained".
3. [ ] **`app/layout.tsx`** — mount `<NgfEditBridge />`, call `getNgfContent()` once, thread `content` through any layout components
4. [ ] **`app/layout.tsx` binding meta tag** — `metadata.other['ngf-public-api'] = 'https://app.ngfsystems.com/api/public/content'`. **Without a binding marker, the "NGF admin — set `site_url`" step below fails with a 422 and the site can never be attached to a client.** See "Binding markers".
5. [ ] **`next.config.{js,ts}`** — add the CSP `frame-ancestors` header
6. [ ] **`vercel.json`** — add the `ignoreCommand` so docs-only commits don't burn build credit (see "Vercel build cost discipline")
7. [ ] **Annotate every page** — wrap each editable element with all four `data-ngf-*` attributes (text, textarea, color, image) and use `data-ngf-group` on every list of cards
8. [ ] **Always `||`, never `??`** for fallbacks
9. [ ] **Vercel env vars** — `NEXT_PUBLIC_SITE_URL` (custom domain or vercel.app), optional `NGF_APP_URL`, `WEBSITE_REVALIDATION_SECRET` (same value as the NGF main app), plus your own (DB, Resend, Clerk if used)
10. [ ] **Deploy to Vercel** — one project per client site
11. [ ] **NGF admin** — set the client's `site_url` in `client_configs` to match `NEXT_PUBLIC_SITE_URL` exactly. The portal editor scrapes the schema on next load.
12. [ ] **Verify in editor** — open the client portal, switch to Manage Sections, confirm all your annotated fields show up in the sidebar with real preview text
13. [ ] **Lead capture** — the site uses `<LeadForm>` (or an existing route calls `relayLeadToNgf()`); enable the **Form Submissions** page (`page_leads`) for the client, then submit a REAL test enquiry and confirm it (a) appears in their portal inbox and (b) still delivers the notification email
14. [ ] **`npm run doctor`** — must exit 0. This mechanically checks most of the rules in this file (see "Verifying a site" below).
15. [ ] **Admin → Ecosystem** — the client must show **Connected**, with "Published content is live" passing. That is the proof the site and the panel are actually bound.
16. [ ] **SEO launch gate** — run the full SEO checklist (SEO & analytics § 8). This is a **hard blocker** — do not flip a site live until every box is checked.

---

## Verifying a site — don't trust, check

This document is long and every rule in it is a "MUST", but for a long time nothing enforced any of them. An audit of nine client repos found the predictable result: five sites on the forbidden `cache: 'no-store'`, six with a missing or **no-op** `/api/revalidate` (returning `{revalidated:true}` while busting nothing), four missing `sitemap.ts`/`robots.ts` — both documented hard launch blockers — and seven running a stale editor bridge. None of it surfaced anywhere, because reading a standard is not the same as meeting it.

Two checks now close that gap. **Run both before calling any site done.**

### 1. `npm run doctor` — per-site conformance

`scripts/ngf-doctor.mjs` ships in `ngf-client-starter`. Zero dependencies; exits non-zero on failure so it can gate CI or a launch.

```bash
npm run doctor            # in the site repo
npm run doctor -- --strict   # treat warnings as failures too
```

**`scripts/ngf-doctor.mjs` must live inside the repo it checks**, with `"doctor": "node scripts/ngf-doctor.mjs"` in `package.json`. Copy it from the starter like any other integration file.

You may run it against a repo that hasn't been refreshed yet by pointing at a sibling checkout:

```bash
node ../ngf-client-starter/scripts/ngf-doctor.mjs   # ad-hoc audit only — never commit this form
```

…but **never leave that form in `package.json`**. A relative path out of the repo resolves on the machine that wrote it and nowhere else — not on Vercel, not in a fresh clone, not in CI — so the launch gate silently cannot run in the only environment that matters. The doctor fails itself on this (`Doctor is self-contained`).

It checks the mechanically-verifiable subset of this doc: content cache mode (including `force-dynamic` on a page that reads NGF content, which defeats ISR even when the fetch is correct), whether `/api/revalidate` actually calls `revalidatePath` **and fails closed**, bridge present *and mounted* **and actually the real bridge** (protocol handlers + size floor, so a stub can't pass), the presence of a portal **binding marker**, CSP + security headers, `sitemap`/`robots`/JSON-LD, `vercel.json` `ignoreCommand`, `??`-instead-of-`||` fallbacks, and annotation correctness — every `data-ngf-field` carrying `label` + `section` (the scraper silently drops the rest), one `data-ngf-group` per list, group paths exactly two segments deep, and no `next/image`-with-`fill` on an annotated element.

**A green doctor is necessary, not sufficient** — it cannot see whether the site is bound to the right client. That's the second check.

### 2. Admin → Ecosystem — live binding proof

A client's portal account and their live website are joined by exactly one thing: a string match between `client_configs.site_url` and the site's `NEXT_PUBLIC_SITE_URL`. When those drift, **nothing errors** — the site just quietly renders its hardcoded fallbacks, and the first signal is the client saying "my edits are gone."

`/admin/ecosystem` contacts every active client site and reports, per client: panel account linked · website connected · domain not duplicated across clients · editor enabled · content published · site reachable · NGF markup detected · **published content actually rendering in the live HTML** · instant-publish (`/api/revalidate`) reachable and secured.

The content check is the one that matters most — it is the only thing that catches a `site_url` / `NEXT_PUBLIC_SITE_URL` mismatch, and the revalidate probe is what surfaces the fail-open and no-op routes described above.

**A site is launch-ready when the doctor exits 0 and Ecosystem shows it Connected.**

---

## Site lifecycle — launch, domain changes, and recovery

A client's editor content lives in the NGF database (`website_content`, keyed to their client record). The **live site finds that content by matching two values that must always agree**:

- `client_configs.site_url` (set in the NGF admin) — what the editor scrapes and what the content API matches on.
- `NEXT_PUBLIC_SITE_URL` (the client site's Vercel env var) — what `getNgfContent()` sends to the content API.

Both are normalized (protocol / `www.` / trailing slash stripped). **If they don't match, the content API returns `{}` and the live site silently renders only its hardcoded fallbacks** — the #1 cause of "the site looks wrong / my edits are gone after going live."

### The mockup → production-domain promotion (the common flow)

Building on a preview URL (e.g. `*.vercel.app`), letting the client edit, then attaching the real domain is the normal path. Do it safely:

1. **While mocking:** set `client_configs.site_url` to the preview URL **and** `NEXT_PUBLIC_SITE_URL` to the same value. The client edits and publishes against the preview.
2. **Going live — flip BOTH URLs together, then redeploy:**
   - In NGF admin, change `client_configs.site_url` to the real domain.
   - On the client's Vercel project, change `NEXT_PUBLIC_SITE_URL` to the same real domain → **redeploy** so the new value ships.
   - Changing only one of the two is the classic break. They are a pair.
3. **Content is preserved across the change.** A `site_url` change writes a *restore-point* snapshot into version history but **does not clear** the live content (this was changed after a production incident where setting the real domain wiped a client's saved edits). The client's edits carry straight over to the real domain.
4. **Verify on the real domain** before telling the client it's live: load it and confirm their edited content renders (not the bare defaults).

> **Best practice:** when feasible, point `site_url` / `NEXT_PUBLIC_SITE_URL` at the **final domain from the start** so there's no flip at all. If you must mock first, treat go-live as one atomic step: *both URLs change together, redeploy, verify.*

### Recovery — "the live site shows defaults / the client's content is gone"

Don't panic; content is almost never actually lost. Work the checklist in order:

1. **Check the URL pair first.** Confirm `NEXT_PUBLIC_SITE_URL` (Vercel) matches `client_configs.site_url` (admin) exactly after normalization. A mismatch makes content *look* gone when it's fine — fix the env var, redeploy, and it returns. Confirm directly: `GET https://app.ngfsystems.com/api/public/content?domain=<the-real-domain>` should return the client's content, not `{}`.
2. **If the content row really is empty,** restore from version history: open the client's editor → **View history** → find the most recent good snapshot (look for a `Restore point — domain changed…` entry or a dated publish) → **Revert**. That promotes the snapshot back to live content.
3. **Re-publish** and re-verify on the live domain.
4. **Never** start fixing by re-typing fields from scratch — restore first, or you'll overwrite a recoverable snapshot.

### Deliberate wipes

Clearing a client's content is a real, occasional need (a client row genuinely repurposed for a different site, real cross-contamination). It is an **explicit, separate action** — the **Reset Website Content** button on `/admin/portal/[clientId]` — never a silent side effect of changing settings. If you want a fresh start, use that button; otherwise every other operation preserves content.

---

## Local development — never deploy to test

The default for every change is **run it locally first.** Don't push speculative work to test on Vercel — it costs build credit and is slower than `npm run dev`.

### `npm run dev` — for 90% of changes

```bash
cd <repo>
npm install            # one time
npm run dev            # opens http://localhost:3000
```

Hot reload picks up file saves in 1–2 seconds. Edit, save, alt-tab to the browser, see the result. Zero deploys.

### `.env.local` setup

Each repo needs a `.env.local` (gitignored) that mirrors the relevant Vercel env vars. For client sites the minimum is:

```
NEXT_PUBLIC_SITE_URL=yourcustomdomain.com      # bare hostname — no protocol
NGF_APP_URL=https://app.ngfsystems.com
```

`NEXT_PUBLIC_SITE_URL` should match `client_configs.site_url` in the NGF database — that way `getNgfContent()` running locally hits the production NGF portal and your local dev shows live published content. To pull every Vercel env var into `.env.local` in one command:

```bash
npx vercel link        # one time per repo — connects to the Vercel project
npx vercel env pull    # writes .env.local from Vercel
```

### `vercel dev` — when you need parity with production

For sites with serverless functions, edge middleware, or Vercel-specific behavior you can't reproduce with `npm run dev`:

```bash
npx vercel dev         # runs with the full Vercel stack on localhost
```

Slightly slower startup but identical to production runtime.

### Testing the NGF portal editor integration locally

Editor work is the one case where pure localhost gets in the way — the portal at `app.ngfsystems.com` needs to load your site in an iframe, which means the local dev server has to be reachable from the public internet. Two options:

**A. Tunnel localhost (free, recommended).** Cloudflared works without an account:

```bash
# one time:
winget install --id Cloudflare.cloudflared
# every dev session:
npm run dev                                       # one terminal
cloudflared tunnel --url http://localhost:3000    # another terminal
# prints a public URL like https://random-words.trycloudflare.com
```

In NGF admin, temporarily set the client's `site_url` to the tunnel URL, open the editor, do your work. Set `site_url` back when done. Hot reload still works through the tunnel.

**B. Skip the editor for visual changes.** If you're iterating on text, layout, or styling — none of that needs the editor in the loop. Open `http://localhost:3000` directly and verify there. Only spin up a tunnel when the change is to bridge behavior, annotation patterns, or anything iframe-specific.

### Type-checking without a build

```bash
npx tsc --noEmit
```

Catches every TypeScript error a Vercel build would catch, in 5–10 seconds. Run before pushing if you've made changes that touch types — saves a failed Vercel build.

### Batching commits

Lots of small changes don't need lots of small deploys. Iterate locally with `npm run dev` over an hour, then push the whole batch via the standard NGF push script:

```bash
python3 github-push.py <repo-name> "feat: redesign hero + new project cards"
```

The script handles staging, committing, and pushing in one call — uses the GitHub Git Data API with the PAT in `github-push-config.json`. See your global `~/.claude/CLAUDE.md` for the canonical command.

If you want to clean up a series of WIP commits before pushing, the standard `git` flow still works locally:

```bash
git reset --soft HEAD~5      # undoes the last 5 commits, keeps changes staged
# now run the push script with one clean commit message:
python3 github-push.py <repo-name> "feat: real summary"
```

### What never to do

- **Don't `vercel --prod` from the CLI** unless you mean to deploy straight to production. Plain `vercel deploy` creates a preview URL but still uses build credit. Push-via-Git is the standard path.
- **Don't push speculative debug commits to test on Vercel.** Reproduce locally; only push when the change is real.
- **Don't ship a feature without running it locally at least once** — the build can pass and the runtime can still throw. `npm run dev` catches things `npx tsc --noEmit` won't.

### Vercel build cost discipline — every repo gets a `vercel.json` ignoreCommand

Every Vercel build burns build-minute credit. A repo with no ignore rule rebuilds on *every* push — including commits that only touch the README, docs, or other files that can't affect the deployed site. Ship a `vercel.json` with an `ignoreCommand` on day one so Vercel skips builds it doesn't need.

**Minimum — skip docs-only commits.** Create `scripts/vercel-skip-docs.sh`:

```bash
#!/usr/bin/env bash
# Vercel inverts the usual convention: exit 0 = SKIP build, exit 1 = BUILD.
# Build only if something OTHER than markdown/docs changed.
if git diff --quiet HEAD^ HEAD -- . ':(exclude)*.md' ':(exclude)docs/**'; then
  echo "Only docs/markdown changed — skipping build."
  exit 0
fi
echo "Source changed — building."
exit 1
```

Wire it up in `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "ignoreCommand": "bash scripts/vercel-skip-docs.sh"
}
```

The NGF main app itself uses the **inline** form below (with a longer exclude list) rather than the script — either is fine, but don't assume the script exists in a repo just because `vercel.json` references one.

**Inline one-liner alternative** if you'd rather not add a script file:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- . ':(exclude)*.md'"
}
```

**Notes:**

- The exit-code convention is backwards from intuition: **exit 0 skips the build, exit 1 runs it.** Get this wrong and you either never deploy or never skip.
- On the first deploy there's no `HEAD^`; Vercel builds anyway. The ignore logic only kicks in on later commits.
- `ignoreCommand` is the right tool for *"skip builds that can't matter."* It is NOT the tool for *"this repo should never auto-deploy at all"* — for that, turn off the Git integration's production/preview deploys in the Vercel project settings (Settings → Git → Ignored Build Step / connected branch). Don't try to permanently disable deploys with an always-skip ignoreCommand.

---

## SEO & analytics — required on every NGF client site

Every client site ships with the same baseline: page metadata, a sitemap, a robots file, structured data for the business, and Google Analytics 4. This is the difference between a site that can be found in Google and one that can't, so it's not optional — it's part of the standard build.

The patterns below are universal. Drop them into any new site verbatim and customize per client.

### 1. Page metadata — every page

Next.js App Router uses the `metadata` export for SEO tags. The root `app/layout.tsx` sets defaults; individual pages override per-page.

```typescript
// app/layout.tsx — root defaults
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(`https://${process.env.NEXT_PUBLIC_SITE_URL || 'example.com'}`),
  title: {
    default: 'Client Business Name — Tagline',
    template: '%s · Client Business Name',
  },
  description: 'One-sentence description of what the business does and where.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Client Business Name',
    images: ['/og-image.jpg'], // 1200x630 in /public
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}
```

```typescript
// app/services/page.tsx — per-page overrides
export const metadata: Metadata = {
  title: 'Services',
  description: 'What we do, in detail. Mention the key service + the location.',
}
```

### 2. Sitemap — `app/sitemap.ts`

Next.js auto-routes this to `/sitemap.xml`. Update the routes array whenever a new page is added.

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${process.env.NEXT_PUBLIC_SITE_URL || 'example.com'}`
  const now = new Date()

  return [
    { url: `${base}/`,         lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/services`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/about`,    lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`,  lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
  ]
}
```

### 3. Robots — `app/robots.ts`

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = `https://${process.env.NEXT_PUBLIC_SITE_URL || 'example.com'}`
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/'] },
    sitemap: `${base}/sitemap.xml`,
  }
}
```

### 4. Structured data — JSON-LD `LocalBusiness`

This is the single highest-ROI SEO action for local businesses. Feeds the Google Maps panel and "near me" search results. Drop it in the root layout's `<body>` so every page emits it.

```tsx
// components/StructuredData.tsx
export default function StructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',         // or 'HomeAndConstructionBusiness', 'AutoRepair', etc.
    name: 'Client Business Name',
    url: `https://${process.env.NEXT_PUBLIC_SITE_URL || 'example.com'}`,
    telephone: '+1-555-555-5555',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Main St',
      addressLocality: 'City',
      addressRegion: 'ST',
      postalCode: '12345',
      addressCountry: 'US',
    },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
        opens: '08:00', closes: '17:00' },
    ],
    priceRange: '$$',
    image: `https://${process.env.NEXT_PUBLIC_SITE_URL || 'example.com'}/og-image.jpg`,
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

Mount in `app/layout.tsx`:
```tsx
<body>
  <StructuredData />
  {/* rest of layout */}
</body>
```

Pick the `@type` that matches the client. Common ones: `LocalBusiness` (generic), `HomeAndConstructionBusiness` (builders), `AutoRepair` (mechanics), `Restaurant`, `Dentist`, `RealEstateAgent`. Full list at schema.org/docs/full.html.

### 4b. Expanding structured data — Service, Review, FAQ

`LocalBusiness` is the floor, not the ceiling. Layer these on when they match what the client actually offers — each one feeds a different rich-result surface in Google.

**`Service`** — one per core service. Helps the site rank for "<service> near <city>" queries:

```tsx
const serviceData = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Primary Service Category',
  provider: { '@type': 'LocalBusiness', name: 'Acme Co' },
  areaServed: { '@type': 'City', name: 'City Name' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Service One' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Service Two' } },
    ],
  },
}
```

**`AggregateRating` / `Review`** — **only when the client has real, verifiable reviews.** Google penalizes fabricated review markup, and self-serving `Review` on `LocalBusiness` is against their guidelines unless it's genuine third-party review data. When legitimate, it pulls star ratings into the snippet. Nest into the `LocalBusiness` object:

```tsx
aggregateRating: {
  '@type': 'AggregateRating',
  ratingValue: '4.9',
  reviewCount: '127',
},
```

**`FAQPage`** — if the site has an FAQ section, mark it up so Google can show expandable Q&A directly in results. One `FAQPage` per page that has an FAQ.

**Validate before launch.** Paste the live URL into the [Rich Results Test](https://search.google.com/test/rich-results), confirm zero errors and that the expected types are detected. This is part of the SEO launch gate below.

**Auto-generation from `client_configs` (roadmap — not yet built).** Business name, address, phone, hours, service list, and review count already live in the NGF database per client. The high-leverage build is a single `<StructuredData client={config} />` component that reads the client's config and emits the correct `@type` + `Service` + `AggregateRating` JSON-LD automatically — so a new site gets complete, accurate structured data with zero hand-authoring and no NAP drift. Until that ships, hand-author per the patterns above. Tracked under "Roadmap — planned standards."

### 5. Google Analytics 4 — `gtag`

Each client gets their own GA4 property. The measurement ID is exposed as `NEXT_PUBLIC_GA_ID` so the client-side gtag snippet can read it.

**GA4 sets cookies, so it must not load until the visitor accepts.** That makes this a `'use client'`
component gated on `hasCookieConsent()` — a server component cannot read consent, and mounting gtag
unconditionally is a compliance problem regardless of how the banner behaves.

```tsx
// components/GoogleAnalytics.tsx
'use client'
import Script from 'next/script'
import { hasCookieConsent } from '@/components/CookieConsent'

export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID
  // No ID, or consent not given → render nothing. CookieConsent reloads the page
  // on Accept, so this re-evaluates and GA loads on the next render.
  if (!id || !hasCookieConsent()) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}');
      `}</Script>
    </>
  )
}
```

Mount in `app/layout.tsx`, together with the banner:
```tsx
<body>
  <GoogleAnalytics />
  <StructuredData />
  {/* rest of layout */}
  <CookieConsent />
</body>
```

**Consent API** (from `components/CookieConsent.tsx` — copy the file from the starter, don't reimplement):

| | |
|---|---|
| `hasCookieConsent(): boolean` | `true` only when consent was explicitly accepted. Returns `false` during SSR (`typeof window === 'undefined'`), so gated scripts never render server-side. |
| localStorage key | `ngf-cookie-consent`, value `'accepted'` \| `'declined'` |
| Banner visibility | Only renders when `NEXT_PUBLIC_COOKIE_ANALYTICS=1` **and** no choice is stored. |
| `resetCookieConsent(): void` | Clears the stored choice and reloads, so the banner returns. **Required** — consent must be as easy to withdraw as to give. Wire it to a "Cookie settings" control reachable from every page (footer and/or privacy policy). |

> **The invariant: `NEXT_PUBLIC_GA_ID` set ⇒ `NEXT_PUBLIC_COOKIE_ANALYTICS=1` set.**
> These two are a pair and neither works alone. Gate GA4 behind `hasCookieConsent()` but forget the env
> var, and the banner never renders → consent can never be granted → `hasCookieConsent()` is false forever
> → **analytics silently never load**, on a site that looks correctly configured. Set both, or neither.
> `npm run doctor` now fails this, fails ungated analytics, and warns when nothing calls
> `resetCookieConsent()`.
>
> **Cookieless analytics (Vercel Analytics) needs no consent** — don't gate it, and don't turn the banner
> on for it. A banner with nothing to consent to is worse than no banner.
| On Accept | Writes the key, then `window.location.reload()` so gated scripts re-evaluate. There is no change event — the reload is the propagation mechanism. |

**Cookieless analytics (Vercel Analytics) needs no consent** — don't gate it, and don't turn the banner
on for it.

### 6. Required env vars (per client site)

Add to the site's Vercel env vars (Production + Preview both):

```
NEXT_PUBLIC_SITE_URL=client-domain.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

`NEXT_PUBLIC_SITE_URL` was already required for the editor integration. `NEXT_PUBLIC_GA_ID` is the GA4 measurement ID (starts with `G-`).

### 7. Per-client GA4 setup — what the NGF operator does once per site

**Inside Google Analytics:**
1. Admin → Create Property (one per client)
2. Add a Web data stream pointing at the client's domain → copy the **measurement ID** (`G-...`) → paste into the client site's `NEXT_PUBLIC_GA_ID` Vercel env var
3. Admin → Property Access Management → grant the NGF service account email **Viewer** role (the email comes from `GOOGLE_SERVICE_ACCOUNT_JSON` in the NGF main app — check the `client_email` field of that JSON)
4. Copy the **numeric property ID** (Admin → Property Settings → Property ID, looks like `533573096`)

**Inside the NGF admin portal (`app.ngfsystems.com/admin/clients/<id>`):**
5. Paste the numeric property ID into the **GA4 Property ID** field under Website Connections → Save Links

That's it. The client now sees their own site analytics in their portal dashboard at `app.ngfsystems.com/portal/portal-dashboard`. They never touch GA4 directly.

### 8. SEO launch gate — hard blocker for every new site

**This checklist is a launch gate, not a nice-to-have.** Do not flip a new client site live — do not tell the client it's launched — until every box is checked. A site that's invisible to Google is a site that doesn't do its job, and retrofitting SEO after launch means lost indexing time. Treat any unchecked box as a release blocker.

- [ ] `app/layout.tsx` has root `metadata` with title template, description, openGraph, twitter
- [ ] At least the homepage, services, about, contact have per-page `metadata.title` + `description`
- [ ] `app/sitemap.ts` exists and lists every public page
- [ ] `app/robots.ts` exists and points to the sitemap
- [ ] `<StructuredData />` is mounted in root layout with the correct `@type` for the business
- [ ] Structured data passes the [Rich Results Test](https://search.google.com/test/rich-results) with zero errors
- [ ] `<GoogleAnalytics />` is mounted in root layout
- [ ] `/public/og-image.jpg` exists (1200×630, brand-consistent)
- [ ] `/public/favicon.ico` + `/public/icon.png` (Next 16 picks these up automatically)
- [ ] `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_GA_ID` set in Vercel env vars
- [ ] GA4 property ID stored in NGF admin portal (so the client sees metrics in their dashboard)
- [ ] **Google Search Console:** property added + verified, sitemap submitted — follow the runbook in § 9 below (don't improvise the method; the wrong property type has to be redone)
- [ ] NAP (name / address / phone) on the site is byte-identical to the client's Google Business Profile (see Google Business Profile section)

### 9. Google Search Console — per-site setup runbook

Search Console is how you find out whether Google can actually index the site, catch crawl errors, and see what the site ranks for. It is also the only way to *submit* a sitemap. Do this **once per client, at launch**, on the real production domain.

**Pick the property type deliberately — this is the part that's annoying to redo.**

| | **Domain property** (recommended) | **URL-prefix property** |
|---|---|---|
| Verify by | DNS `TXT` record at the registrar | HTML meta tag, file upload, GA, or DNS |
| Covers | `http` + `https`, `www` + non-`www`, **all subdomains** — everything, forever | **Only the exact prefix** you entered |
| Use when | You (or the client) control DNS — the default choice | You can't touch DNS |

**The URL-prefix trap:** `https://example.com` and `https://www.example.com` are *different properties*. Verify one and the other reports zero data, which looks exactly like "Google can't see the site." Domain property avoids this entirely — prefer it.

**Method A — DNS TXT (domain property, preferred):**
1. Search Console → *Add property* → **Domain** → enter the bare domain (`example.com`, no protocol, no `www`).
2. Copy the `TXT` record Google shows.
3. Add it at the registrar (or wherever DNS is hosted — often Vercel or Cloudflare) on the root/`@` record. Propagation is usually minutes; allow up to a few hours.
4. Click **Verify**.

**Method B — HTML meta tag (URL-prefix, when DNS isn't available):** set the `GOOGLE_SITE_VERIFICATION` env var on the site's Vercel project to the token Google gives you and redeploy. The starter's root layout already emits it via Next's `metadata.verification.google` — **no code edit required.** (Env var only, so verification is per-site config, not a source change.)

**Then, in order:**
5. **Submit the sitemap:** *Sitemaps* → enter `sitemap.xml` → Submit. (The site must already serve `app/sitemap.ts` — it's a launch-gate item.)
6. **Request indexing** for the homepage via *URL Inspection* → *Request indexing*. This is the single fastest nudge for a brand-new site.
7. **Add the client as a user** if they want visibility: *Settings → Users and permissions* → add their Google account as **Full**. **Keep NGF as the verified owner** — if the client's verification method is later removed, an owner-less property loses access.
8. **Check back after ~1 week:** *Pages* (indexed vs not, and why) and *Coverage* errors. A new site showing "Discovered – currently not indexed" for a while is normal; "Blocked by robots.txt" or "Redirect error" is not — fix immediately.

**Never remove the verification record.** Google re-checks periodically; deleting the TXT record or the meta tag silently un-verifies the property and you lose all access (the history stays, but you must re-verify to see it). This is a real trap when a domain is migrated or a registrar is changed — re-add the record as part of any DNS move.

**Common gotchas:**
- Verifying the `*.vercel.app` preview URL instead of the production domain — the data is useless. Verify the final domain (another reason to point at the real domain from the start, per Site lifecycle).
- Submitting `/sitemap.xml` with a leading slash or the full URL — Search Console wants the path relative to the property root.
- Expecting instant data — Search Console backfills over days, and impressions data lags ~2 days. Don't debug an empty dashboard on day one.

---

## Google Business Profile — per-client local SEO setup

Separate from the website but arguably higher-impact for a local business than anything on the site itself. The Google Business Profile (GBP) is what populates the Maps pin, the right-side knowledge panel, and the "near me" / local-pack results. A claimed, complete, active GBP routinely out-pulls on-site SEO for local intent. Treat it as a standard deliverable on every client launch.

**This is a one-time-per-client setup done in the [Google Business Profile dashboard](https://business.google.com) — not code.** But it's part of what NGF delivers, so the standard lives here.

### Setup workflow

1. **Claim or create** the profile. If one already exists (Google auto-generates them for many businesses), **claim it — don't create a duplicate.** Duplicate profiles split signals and hurt ranking.
2. **Verify** — Google sends a postcard, phone, or email code depending on the business type. Postcard verification can take several days, so **start this early in the engagement**, not at launch.
3. **Complete every field** — Google rewards completeness:
   - Exact business name (must match the website + NAP everywhere — see below)
   - Primary category + relevant secondary categories (**category choice is a major ranking factor** — pick the most specific accurate primary)
   - Address, or a defined service area for businesses without a storefront
   - Phone + website URL (point it at the client's live NGF site)
   - Hours, including holiday hours
   - Services / products with descriptions
   - Business description (up to 750 chars — keyword-aware but natural)
4. **Photos** — logo, cover, interior/exterior, team, work samples. Profiles with photos get materially more calls and direction requests. Reuse assets from `_NGF\Clients\<Client>\Assets\`.
5. **NAP consistency** — Name, Address, Phone must be **byte-identical** across the GBP, the website footer/contact page, the `LocalBusiness` JSON-LD, and any directory listing. Inconsistent NAP is one of the most common local-SEO killers. The site's canonical `brand.businessName` / `brand.phone` / `brand.address` fields must match the GBP exactly.
6. **Link the website** — set the GBP website field to the live NGF domain so profile clicks flow into the client's GA4.

### Ongoing (set client expectations up front)

- **Reviews are the single biggest ongoing GBP ranking lever.** Encourage the client to ask happy customers for Google reviews and to respond to every one. Only add `AggregateRating` JSON-LD to the site once those reviews are real and live on the profile.
- **Google Posts** (offers, updates, events) — optional, but active profiles rank better.
- **Keep hours and photos current** — stale profiles decay in the rankings.

### Where it fits in the launch

Because verification can lag the website by days, **kick off GBP at the start of the engagement, not the end.** The website can go live without it; the GBP just needs to be in-flight. Add "GBP claimed + verification started" to the client onboarding checklist.

---

## Database — only if the site needs its own data

Most marketing sites don't need a database. If your site has a contact form or service requests:

- **Drizzle + Neon** for client sites (lighter, no migration daemon)
- **Prisma 5 + Neon** for the NGF main app only

Single client per app:
```typescript
// db/client.ts (Drizzle)  OR  lib/db.ts (Prisma)
// — only one PrismaClient / Drizzle instance per app
```

Multi-tenant queries always filter by `client_id` at the ORM level, never in JavaScript.

---

## Auth — only if the site needs it

Most NGF marketing sites don't need auth. If your site has a logged-in admin or customer area:

- **Clerk** is the standard. Pin `@clerk/nextjs@6` (v7 has breaking JWT changes).
- Customize the session token at Clerk dashboard → Configure → Sessions → add `{ "metadata": "{{user.public_metadata}}" }` so `sessionClaims.metadata.role` exists.
- Layout components must NEVER do auth checks — middleware handles all auth.
- After setting a role, the user must sign out and back in for it to take effect.
- Public routes (e.g. tokenized booking links sent via email — customers don't have accounts) MUST be in the middleware's `createRouteMatcher` whitelist or they'll be redirected to sign-in.

---

## Security baseline — required on every NGF site

Every NGF site (client marketing site or main app) ships with the same baseline. None of these are optional. The reference implementation is `NGF-Systems-app/next.config.js` — copy from there.

### 1. Security headers in `next.config.{js,ts}`

```js
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.accounts.dev https://js.stripe.com https://www.googletagmanager.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://api.stripe.com https://www.google-analytics.com https://*.googletagmanager.com https://*.vercel-storage.com https://*.public.blob.vercel-storage.com https://app.ngfsystems.com",
          "frame-src 'self' https://*.stripe.com https://challenges.cloudflare.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
    ],
  }]
}
```

The `connect-src` entry for `https://app.ngfsystems.com` is required for **browser-side** calls to the NGF public API — the booking widget's availability/booking fetches. It is **not** needed for content: `getNgfContent()` runs server-side in an async server component, and CSP does not govern server fetches. (Earlier revisions of this doc claimed otherwise.)

`'unsafe-inline'` and `'unsafe-eval'` are required by Clerk and Next.js runtime chunks. Tightening to nonce-based CSP is a future hardening pass.

**Clerk custom Frontend API domain — required carve-out.** When a site uses a production Clerk publishable key (`pk_live_…`), Clerk routes its Frontend API through a custom subdomain on the user's own domain — typically `clerk.<your-app-domain>` (for the NGF main app: `clerk.app.ngfsystems.com`). The publishable key encodes this domain in base64 — decode the part after `pk_live_` to find it. Both `script-src` AND `connect-src` AND `frame-src` MUST include this custom domain or sign-in fails with silent CSP-blocked requests. The `*.clerk.com` and `*.clerk.accounts.dev` allowances DON'T cover the custom domain. Symptoms: sign-in page loads but submission stalls, console fills with `Refused to load the script 'https://clerk.<your-domain>/...'` errors. Each NGF site with its own Clerk instance has a different custom domain — derive it from the site's publishable key and add to CSP at setup time.

### 2. The portal-editor frame-ancestors carve-out

`frame-ancestors` is a **directive inside the single CSP above** — never a second
`Content-Security-Policy` entry. Add it to the same `value` array:

```js
"frame-ancestors 'self' https://app.ngfsystems.com https://*.vercel.app",
```

Without it, the portal editor's live preview iframe is blocked.

> **Never write two `Content-Security-Policy` entries.** An earlier revision of this document told you to
> add the carve-out as a second header, on the theory that browsers intersect multiple CSP headers. Browsers
> do — **but Next.js never emits two.** Headers are assembled into a plain object (`resHeaders[key] = value`);
> `set-cookie` is the only key that accumulates. Everything else is last-write-wins, in one rule or across
> rules, regardless of `source` matchers.
>
> Verified empirically on this starter: adding the carve-out as a second entry and reading the response gives
> exactly **one** header —
> `Content-Security-Policy: frame-ancestors 'self' https://app.ngfsystems.com https://*.vercel.app` —
> with `default-src`, `script-src`, `style-src`, `img-src`, `connect-src`, `object-src`, `base-uri` and
> `form-action` **silently gone**. Order the other way and the editor preview breaks instead. Either way one
> policy is destroyed with no warning, and `npm run doctor` used to pass it because it greps config *text*.
> It now fails on a second entry. Check the real thing after deploy:
>
> ```bash
> curl -sI https://your-client-domain.com | grep -i content-security-policy
> ```
>
> One line back, containing both the baseline directives and `frame-ancestors`.

### 3. Server-side input validation on every state-changing endpoint

API routes that accept POST/PATCH/PUT bodies MUST sanitize the payload before persisting. Three rules:

1. **Validate root shape.** Reject with 400 if the body isn't the expected type (object vs array, etc.).
2. **Strip non-conforming fields.** Don't persist arbitrary keys — accept only the structure the client legitimately sends.
3. **Cap payload size.** A hard upper bound (e.g. 250 KB serialized) prevents DB bloat from abusive payloads.

Reference: the `sanitizeContent` helper in `NGF-Systems-app/app/api/portal/website/route.ts`.

### 4. Prototype-pollution defense

Strip dangerous keys (`__proto__`, `constructor`, `prototype`) at every depth when accepting JSON from clients. One liner:

```ts
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
// in any object iteration:
if (DANGEROUS_KEYS.has(key)) continue
```

### 5. SSRF guard on any server-side `fetch()` of a user-influenced URL

The schema scraper, image proxies, webhook callbacks, anything that fetches a URL someone else can set — must reject:

- Non-`http(s)` protocols
- `localhost`, `0.0.0.0`, `::1`
- Private IPv4 ranges (`127.`, `10.`, `192.168.`, `169.254.`, `172.16.0.0/12`)
- Private IPv6 (`fc::/7`, `fe80::/10`)

The `169.254.169.254` carve-out matters specifically — that's the AWS/GCP cloud metadata endpoint, the textbook SSRF target. Reference: the `isSafeScrapeUrl` helper in `NGF-Systems-app/app/api/portal/website/route.ts`.

### 6. Identity from session, not from input — and never one gate only

Never trust a `client_id` (or `user_id`, `account_id`, etc.) from the request body, query string, or URL params for authorization decisions. Always resolve from the authenticated session token.

**Middleware is a first pass, never the only pass.** Every privileged page and route re-checks the role *in the same request that does the data access*:

- Middleware role checks only match **page paths** — `/api/*` handlers must re-check `role` themselves.
- Framework middleware gets bypassed. Next.js has shipped multiple middleware-bypass advisories (most recently the App Router segment-prefetch bypass, `GHSA-267c-6grr-h53f`). If middleware is the only gate on a page that renders every client's data, one framework CVE is a full data exposure.
- A **layout-level** check is also not sufficient on its own — Next does not re-render a layout on client-side navigation between sibling routes. Guard the layout *and* each page.

Reference: `NGF-Systems-app/lib/require-admin.ts`, called from `app/admin/layout.tsx` and from every `app/admin/**/page.tsx`.

> This supersedes the older rule "layout components must not do auth checks." That rule was about avoiding *duplicated, inconsistent* auth — it was never meant to make a single framework mechanism the only thing standing between a signed-in client and every other client's data. Server-side guards in admin layouts **and** pages are now required.

### 6b. Every `window.addEventListener('message')` needs a sender guard

`postMessage` is cross-origin **by design**. An unguarded listener accepts messages from any
page on the internet, and a CSP `frame-ancestors 'none'` does **not** stop it — that blocks
*embedding*, not an opener→popup handle. A malicious page only needs
`window.open('…/portal/website')`, kept in a variable, then `postMessage` at it.

This was a real defect in the website editor. Its handlers wrote into content state and
auto-saved **with the signed-in owner's own cookies**, so attacker-chosen text landed in that
client's draft and would have gone live on their next Publish.

**Both ends must check, and they check different things.**

*The editor (parent)* — before anything touches state:

```ts
if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return
if (senderHost !== expectedHost) return
```

`e.source` is what actually kills the `window.open` vector — an attacker's window is never
your iframe's `contentWindow`. Compare the **normalised host**, not the raw origin: the iframe
loads `site_url` and the site may redirect (apex↔www, http→https are routine), after which
`e.origin` is the *final* origin. Comparing raw origins rejects every message and silently
kills the editor on any redirecting site.

*The bridge (child)* — allowlist the portal origin, then reply only to that origin, never `'*'`
(the initial `ngfReady` handshake is the one exception, and it carries no data).

Belt and braces: `Cross-Origin-Opener-Policy: same-origin-allow-popups` on portal pages severs
the opener handle at the browser level. Use `allow-popups`, not bare `same-origin`, or Clerk's
OAuth popup breaks.

### 6c. Claim a tenant atomically — never overwrite an existing binding

Linking a Clerk identity to a client row by email must refuse to take a row someone already
owns. `clerk_user_id` is unique, so an unconditional update wouldn't add a second owner — it
would **replace** the real owner's binding and hand over the entire tenant.

```ts
const claimed = await db.client.updateMany({
  where: { id: byEmail.id, clerk_user_id: null },   // only if unclaimed
  data:  { clerk_user_id: clerkUserId },
})
if (claimed.count === 0) return null   // refuse and log — do not steal
```

One statement, no read-then-write race. Apply it to **every** copy of that logic — duplicated
resolvers are how a fix half-lands.

### 6d. Public endpoints need abuse limits, not just auth checks

The unauthenticated surface was audited and found sound on *confidentiality* — no cross-tenant
read, no injection, no PII leak. What was weak was **abuse resistance**: a stranger can't steal
anything, but can *consume* a client's calendar, a client's inbox, and your sending reputation.

- **Anything that creates a record must cap per-identity, not just per-IP.** IPs are the
  cheapest thing on the internet. Bookings cap outstanding future appointments per
  email/phone per business (real customers hold one or two; a script needs hundreds).
  Without it, an attacker reads the open-slot list and books every slot until the calendar
  is unusable.
- **Every automated email is an amplifier.** A confirmation sent to an attacker-chosen
  address, from your shared sending domain, puts *every* client's lead notifications at
  risk. Cap the sending, and check that your cleanup path doesn't send a second wave.
- **When you hit a cap on a lead write, still persist and suppress only the email.** The
  endpoint exists so a submission is never dropped; silently discarding a real enquiry is
  the failure you are defending against. The client still sees it in their portal.
- **Tokens in emailed links** (booking self-manage) must be CSPRNG, single-use for anything
  destructive (null the token when it's spent), refuse actions on records that have already
  happened, and respond `Cache-Control: no-store, private` — the URL carries a secret.
- **Cache the domain→client lookup.** A public endpoint must never scan the whole clients
  table per request; that's an unauthenticated cost amplifier.

### 7. Webhook signature verification

Stripe webhooks: `stripe.webhooks.constructEvent(rawBody, signature, secret)`. Clerk webhooks: `svix` library with `CLERK_WEBHOOK_SECRET`. Never trust webhook bodies without verification — anyone with the URL can POST to them.

Routes excluded from the middleware matcher (`api/webhooks`, `api/leads`) have **no** edge protection — whatever gates them must live in the handler, and must fail **closed** when its secret is unset.

### 8. Env vars never in the bundle

`NEXT_PUBLIC_` prefix means the value ships in the JS bundle, accessible to anyone. Use this for genuinely-public values only (Clerk publishable key, GA4 measurement ID, site URL). Secrets — Stripe secret key, Resend API key, service-account JSON, database URLs — must NOT have the `NEXT_PUBLIC_` prefix.

### 9. Image-upload safety

Any endpoint that accepts a user-uploaded image (the portal editor's `app/api/portal/upload`, and any client-site upload) MUST harden the upload path. These are lessons from a real audit of the upload pipeline:

1. **Never serve user SVGs inline.** SVG can carry `<script>`, so a stored `.svg` served with `Content-Type: image/svg+xml` is a stored-XSS vector if anyone navigates to it. Either (a) sanitize SVGs on upload (svgo/DOMPurify), (b) store them with `Content-Disposition: attachment` so the browser downloads rather than renders, (c) rasterize them through the image pipeline (the NGF app converts SVG → WebP via Sharp), or (d) don't accept SVG at all. Pick one — don't pass raw SVG through.
2. **Fail closed when image processing throws.** If Sharp (or your optimizer) errors on a file the client *claimed* is a raster (`image/jpeg`, `image/png`, …), return `400` — do **not** fall back to storing the original bytes. `file.type` is attacker-controllable; a non-image claiming `image/jpeg` must not get stored just because optimization failed. The "every raster is validated by Sharp" guarantee only holds if failure rejects.
3. **Cap input dimensions (pixel-bomb defense).** Set an explicit `limitInputPixels` on Sharp and fail closed when exceeded, so a small file that decompresses to a huge bitmap can't exhaust memory.
4. **Don't leak processor internals.** On error, return a generic message to the client and log the detail server-side — never echo raw `error.message` (Sharp/Blob internals) back in the response.
5. **Scope storage paths to the resolved client.** Upload keys must be derived from the session-resolved `client.id` (e.g. `clients/${client.id}/…` with a random suffix), never from a `client_id` in the request. Same identity invariant as everywhere else.

The NGF app's `app/api/portal/upload` is the reference implementation of all five.

### 10. Periodic third-party audit

Run a security audit (manual or AI-driven) on each site at least once per major feature release. Confirm: CSP is intact, no secrets in bundles, all POSTs validate input, no admin routes are reachable as a client.

---

## Lead capture: persist first, email second

Any form that captures a lead or customer submission (contact, booking, quote, etc.)
MUST persist the submission to the central NGF lead store as the system of record BEFORE
attempting any email notification. Email is a notification, never the system of record.

- The client site POSTs every submission to `POST https://app.ngfsystems.com/api/public/leads`
  (the same origin it GETs the content API from) with `{ domain, formType, payload }`. NGF
  persists it to the `leads` table — resolving the client by `domain` — then emails
  best-effort. No per-site database is needed; one lead store, one admin inbox.
- Include a honeypot field — a **non-semantic** hidden input (e.g. `_gotcha`), never a
  real-sounding name like `url`/`website`/`company` — that the form leaves empty; the
  endpoint drops any submission that fills it, and also rate-limits + validates the write.
- A failed persist returns an error so the form shows a retry — never a false "thanks".
  A failed/throwing email never loses or rolls back the saved row.
- Email-only forms are non-conformant (see the June 2026 lead-loss
  incident).

### The two conformant shapes — use one, never hand-roll a third

**Hand-authoring a form + API route per site is how this broke in the first place.** The
starter shipped no form at all, so every site invented its own: five route names, four
storage strategies, and an audit found **not one of them** reached the central store. One
site was email-only (a failed send lost the enquiry outright); another persisted to its own
database and notified **nobody**, so the business never learned a customer had been in touch.

**A. New sites — `<LeadForm>` (`ngf-client-starter/components/LeadForm.tsx`).**
Posts straight to the central store from the browser. There is **no API route on the site
at all**, so there is nothing to drift.

```tsx
import { ngfEndpoints } from '@/lib/ngf'
import LeadForm from '@/components/LeadForm'

const { base, domain } = ngfEndpoints()
<LeadForm base={base} domain={domain} formType="contact" />
```

Defaults to name / email / phone / message; pass `fields` for anything else, and `hidden`
for server-side context (e.g. which property a booking enquiry is about). It renders success
**only** on a real 2xx — never a thank-you over a failed save, which is precisely the failure
that lost leads.

**B. Existing sites with a bespoke form — `relayLeadToNgf()` (`lib/ngf-lead.ts`).**
Call it inside the route they already have, **before** the notification email:

```ts
import { relayLeadToNgf } from '@/lib/ngf-lead'

await relayLeadToNgf('contact', parsed.data)   // persist first
await sendContactNotification(parsed.data)      // existing email, unchanged
```

**Do not rip out a live client's form to swap in `<LeadForm>`.** One site's form has ten
fields, six dropdowns, and both its labels *and* its option values are portal-editable
content; another sends a branded HTML email with a project-details table the owner actually
reads. A wholesale swap silently removes capability the business depends on. The relay is
deliberately additive — existing validation, email and success/error UX are untouched — and
it **never throws** (every path returns `{ ok }`), so it cannot make a live submission worse
than it is today.

### Client emails are unaffected — say so plainly

Adding the relay does **not** change, replace, or redirect the notification the client
already receives. Persist first, then their existing email goes out exactly as before. The
relay only adds a durable record and the portal inbox.

### The client sees their own submissions

Every submission appears in the client's portal under **Form Submissions**
(`/portal/portal-leads`), gated by the `page_leads` toggle in their config. They can filter
by status, work each enquiry through **New → Contacted → Won / Lost / Archived**, and keep a
private note per lead. Enable the toggle when you launch a site with a form — otherwise the
leads accumulate where only you can see them.

> **Enforced, not just documented.** `npm run doctor` fails a site whose route takes customer
> details without relaying — and it detects *both* failure shapes, including the
> persists-but-notifies-nobody case that a mailer-only check misses.

## Transactional email: send from the verified ngfsystems.com domain

Lead-notification email is sent by the central `/api/public/leads` endpoint from the single
verified domain **ngfsystems.com** (e.g. `NGF Systems <noreply@ngfsystems.com>`), with
**reply-to = the customer's address**.

- Never send from an unverified client domain or Resend's `onboarding@resend.dev` sandbox —
  Resend 403s those to any recipient other than the account owner, silently dropping mail.
- The from-domain is invisible on internal lead notifications (they go to the business owner,
  not the customer), so ngfsystems.com needs zero per-client DNS. Verify a client's own domain
  only when they need customer-facing email from their own brand.
- Required env per site: `RESEND_API_KEY`, `EMAIL_FROM` (@ngfsystems.com), `EMAIL_TO`/notify list.

## Launch gate (add to the hard-launch checklist)

A site is not "live" until a REAL test submission through EVERY form is confirmed to (1) save
to the DB and (2) deliver the notification email end-to-end. No form ships unverified.

## Privacy & cookie policy — required on every site

Every client site that collects personal data (any contact / booking / quote form) or runs
analytics MUST ship a **Privacy & Cookie Policy**, linked from the footer, before launch. This
is a compliance baseline, not optional: Google Analytics' terms and California's CalOPPA both
require a posted policy once a form or analytics exists — and because submissions route to the
central NGF lead store, the policy must disclose that NGF processes and stores them on the
client's behalf.

- Reference implementation: `ngf-client-starter` `app/privacy/page.tsx`, linked from the footer.
  Plain-English boilerplate that pulls the business name + contact from content and discloses
  form data, analytics/cookies, retention, CCPA-style rights, and the real processors (NGF
  Systems, Resend, Vercel).
- Cookies: always disclose them in the policy. A consent banner is **required** when the site
  loads **cookie-based** analytics (Google Analytics, Microsoft Clarity, Meta pixel, …): gate
  those scripts behind `hasCookieConsent()` and mount the starter's `CookieConsent` banner
  (set `NEXT_PUBLIC_COOKIE_ANALYTICS=1`) so they never load without consent. Prefer cookieless
  analytics (Vercel Analytics) to skip the banner entirely. Session-recording tools (Clarity,
  Hotjar) especially must not run without consent.
- Not legal advice: the client is the data controller and owns the final policy. NGF supplies
  the template; flag "have your attorney review it" at handoff.

---

---

## Accessibility — required on every client site

**This is legal exposure, not polish.** NGF builds sites for US small businesses, which are exactly the targets of high-volume ADA web-accessibility claims. A demand letter over an inaccessible site is a real cost to a client and a real reputational cost to NGF. It is also an SEO factor — the same semantics screen readers use are what crawlers use.

**Target: WCAG 2.1 Level AA.** The floor, on every site:

- **Contrast** — body text ≥ **4.5:1** against its background; large text (≥24px, or ≥19px bold) and meaningful UI borders ≥ **3:1**. Check the brand palette *before* committing to it; a light-grey-on-white brand is a rebuild later.
- **Every image has meaningful `alt`.** Decorative images get `alt=""` (not a missing attribute). Client-editable images use the `<field>_alt` convention so the client can write it themselves — with a sensible hardcoded fallback.
- **Keyboard operable end to end.** Every interactive element reachable and activatable by keyboard, in a sensible order. If you can't tab to it, it doesn't work. Never remove focus outlines without replacing them — `:focus-visible` styling is required, and it must be visible against the brand background.
- **Semantic landmarks** — one `<h1>` per page, headings that descend without skipping levels, real `<nav>` / `<main>` / `<footer>`, and `<button>` for actions vs `<a>` for navigation. Don't build a clickable `<div>`.
- **Forms** — every input has an associated `<label>` (placeholder is not a label). Errors are announced in text, not by color alone.
- **Never convey meaning by color alone** — pair it with text or an icon.
- **Respect `prefers-reduced-motion`** — gate parallax, autoplay, and large transitions behind it.
- **Touch targets ≥ 44 px** (already in the design rules).
- **The editor bridge does not exempt you.** `sr-only` anchor spans must keep `aria-hidden="true"` so screen readers don't read duplicate content.

**Launch check:** run Lighthouse's accessibility audit (or axe DevTools) on every template page — investigate anything below **95**, and fix every "serious" or "critical" issue. Tab through the whole page once, by hand, with no mouse. Add both to the launch gate.

---

## Error monitoring & uptime — how we find out before the client does

Today, if a client site throws on render or its contact form starts 500ing at 2am, **nobody finds out until the client calls.** That is the same class of failure as the lead-capture incident — silent loss, discovered late — but at the site level. "Reliable" is not claimable without this.

Required on every client site and on the main app:

1. **Error tracking.** Wire a Sentry (or equivalent) project per site; capture server + client exceptions. The DSN is a public value; the auth token is not. Alert on new issues and on error-rate spikes, not on every event.
2. **Uptime monitoring.** An external HTTP check on the site root and on any revenue-critical route (booking, contact) — at least every 5 minutes, alerting to email/SMS. External is the point: a check that runs *inside* the thing being monitored tells you nothing when it's down.
3. **Form/booking submission alerting.** Every lead and booking already persists first; alert on *persist failures* specifically — that's the case where a customer thinks they reached the business and didn't.
4. **Weekly Ecosystem check.** Open **Admin → Ecosystem**. Anything not "Connected" is triaged that week. This is the cheapest possible catch for a silently-unbound site.
5. **Log what you can't alert on.** Every `catch` that swallows an error must `console.error` with enough context to identify the client and the operation. A silent `catch {}` is forbidden in any path that touches customer data.

**Deliberately out of scope for now:** full APM/tracing and log aggregation. Error tracking + uptime + the weekly Ecosystem pass covers the failure modes that have actually bitten us.

---

## Design system — universal rules + per-client aesthetic

Each client site has its own visual identity — colors, typography, density, theme — driven by the brand the client already has. **Do NOT default every new site to a particular look.** Before designing anything, ask the user what direction this client wants, or look at existing client materials (logo, existing site, brand guide) for cues. Two illustrative archetypes (deliberately opposite, to show the range):
- **A builder / professional-services site** — light theme, a single deep brand color, serif headings, soft shadows on white cards
- **A trade / industrial site** — bright accent pair, dark slate panels, technical/condensed typography

Both follow the universal rules below. Neither is "the NGF look" — there is no NGF house style.

### Universal rules — apply to every client site regardless of aesthetic

- **Tailwind utility classes for all styling.** Brand colors and spacing tokens live in `app/globals.css` as CSS custom properties; consume them via Tailwind's arbitrary-value syntax: `text-[var(--text)]`, `bg-[var(--bg)]`, `border-[var(--line)]`. Two narrow exceptions where `style={{ … }}` is acceptable: (a) when the value is genuinely dynamic from a JS expression — e.g. `style={{ backgroundColor: brandColor }}` where `brandColor` is a prop; (b) when targeting a CSS property Tailwind doesn't have a utility for (rare). Never write a separate CSS file for component-level styling.
- **Pick one theme and commit** — light or dark, then use it everywhere. Don't mix dark and light in the same site. We've shipped this regression: homepage light, intake/booking dark — confusing and an obvious tell.
- **Mobile-first responsive** — write the mobile layout, scale up with `md:` and `lg:`. Every page must work at 375 px / 768 px / 1280 px.
- **44 px minimum touch targets** on mobile.
- **Generous whitespace** — most sites we ship err toward dense; tighten if the brief calls for it but the default is breathing room.
- **No "AI-looking" filler** — heavy gradients, purple-everywhere, generic stock photography, neon glow effects. Specific brand directions can override (a gym site might want neon), but never reach for these as defaults.
- **TypeScript interfaces for all component props** — no `any`.
- **Default to server components** — `'use client'` only when strictly necessary (event handlers, hooks, browser APIs).

### When the client hasn't given a direction

Ask first. If you genuinely have to make a call without input, the safest default is light theme + a single brand-matched accent color + soft cards (`shadow-sm rounded-xl border border-gray-100`) + system-ui sans serif. Refined and uncontroversial. But this is a fallback for "we don't have a brief yet," not "the NGF house style." Any real client deserves a real direction.

---

## Universal interaction patterns

Behaviors that should feel identical across every NGF client site so a visitor who learns one site implicitly knows them all. Every NGF site implements these the same way using the same library — no custom variants, no per-site reinventions.

### Image modal — click to zoom, drag to pan, gallery navigation

Whenever an image on an NGF client site is openable — gallery cards, hero slideshows, property photo grids, floor plan diagrams, team photos, before/after sets — it MUST open in a standard NGF image modal with these guaranteed behaviors:

- **Click/tap the image** → opens full-screen modal with dimmed backdrop (~85% black)
- **Image starts fit-to-viewport** with even padding on all sides
- **Click the open image** → zoom toggle (fit ↔ natural / ~2× size). Mouse wheel zooms further on desktop; pinch zooms on mobile.
- **When zoomed, drag to pan** — mouse drag on desktop, finger drag on mobile
- **Close via four methods, all equivalent**: × button (top-right), ESC key, click on backdrop, swipe-down on mobile
- **Body scroll locked** while open, scroll position restored exactly on close
- **Focus trapped** when open, focus returned to the trigger image on close
- **For galleries** (two or more images in one `<PhotoProvider>`): arrow keys / on-screen arrows / mobile swipe navigate prev↔next, loops at the ends, counter shown ("3 / 12")
- **Captions optional per-image** — opt in by passing an `overlay` prop, omit otherwise
- **Smooth ~250 ms transitions** for open, zoom, navigation

**Implementation: `react-photo-view`**

```bash
npm install react-photo-view
```

Import the CSS once globally, then use the component anywhere:

```tsx
// app/layout.tsx
import 'react-photo-view/dist/react-photo-view.css'
```

**Single image** — wrap with one `<PhotoProvider>` and one `<PhotoView>`:

```tsx
import { PhotoProvider, PhotoView } from 'react-photo-view'

<PhotoProvider>
  <PhotoView src="/floorplans/bayside-full.jpg">
    <img
      src="/floorplans/bayside-thumb.jpg"
      alt="The Bayside floor plan"
      className="cursor-zoom-in"
    />
  </PhotoView>
</PhotoProvider>
```

**Gallery** — multiple `<PhotoView>` inside ONE `<PhotoProvider>` makes them browseable as a set:

```tsx
<PhotoProvider>
  {properties.map((p) => (
    <PhotoView key={p.id} src={p.fullImage}>
      <img
        src={p.thumbnail}
        alt={p.name}
        className="cursor-zoom-in"
      />
    </PhotoView>
  ))}
</PhotoProvider>
```

**Caption** — opt in per image via the `overlay` prop:

```tsx
<PhotoView
  src={fp.fullImage}
  overlay={
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
      {fp.name} — {fp.squareFeet} sq ft · {fp.bedrooms}BR · {fp.baths}BA
    </div>
  }
>
  <img src={fp.thumbnail} alt={fp.name} className="cursor-zoom-in" />
</PhotoView>
```

**Required rules:**

1. **One `<PhotoProvider>` per gallery context.** All `<PhotoView>` inside the same provider become a navigable set. Putting them in different providers makes them disconnected single-image lightboxes — usually NOT what you want for gallery grids.
2. **Always add `cursor-zoom-in`** (Tailwind utility) to the trigger `<img>`. Visual affordance that the image is interactive.
3. **Use plain `<img>` for triggers, not `next/image`.** Same rule as for `data-ngf-field` image annotations — the bridge and the modal both need direct DOM access.
4. **Pass a separate high-res `src` to `<PhotoView>` and a smaller `src` to the trigger `<img>`** when image weight matters. The thumbnail loads on page render, the high-res only loads when the modal opens.
5. **Never build a custom lightbox or image modal.** This is the standard for every NGF site, no exceptions. Consistency across sites matters more than per-site customization.

**Per-client styling overrides:**

Default styles look professional out of the box. Per-client tweaks belong in `app/globals.css` and should be limited to color/accent — never restructure the modal layout, scroll behavior, or close affordances, because those are the cross-site standard:

```css
/* Optional — match modal chrome to client brand */
.PhotoView-Slider__ArrowLeft,
.PhotoView-Slider__ArrowRight,
.PhotoView-Slider__Counter { color: var(--accent); }
```

**When to apply this pattern** (case-by-case checklist):

- ✅ Floor plan diagrams, property photo galleries, before/after construction shots
- ✅ Team member photos, especially if there's an "about" page bio worth showing larger
- ✅ Service galleries (auto detailing before/after, completed builds, project portfolios)
- ✅ Any image where a visitor's natural instinct is "I want to see that bigger"
- ❌ Pure decorative background images, icon-sized photos in nav, logos, hero photos that fill the viewport already
- ❌ Anything inside the portal editor (the editor has its own iframe-based preview)

---

## Absolute rules — never break

These apply to **every** project, client site or main app.

1. TypeScript only — never `.js` files for **application code**. Config files at the repo root (`next.config.js`, `postcss.config.js`, `tailwind.config.js`) and standalone tooling scripts (`scripts/*.mjs`, `*.sh`) are exempt
2. Tailwind utility classes for all styling — never write a separate component CSS file. CSS custom properties from `globals.css` are consumed via Tailwind arbitrary-value syntax (`bg-[var(--bg)]`, `text-[var(--text)]`). Inline `style={{ … }}` is permitted only for genuinely dynamic values from JS (e.g. a prop-driven color). See the "Universal rules" in the Design system section for full detail.
3. `any` is forbidden — use proper interfaces
4. Never duplicate components, functions, or layouts — check if it exists first
5. Never hardcode keys, secrets, or connection strings — use env vars
6. Never report a file as updated without verifying the write (`cat` it back)
7. Mobile-first responsive — every page works at 375 / 768 / 1280
8. Never ship a feature without testing the unhappy paths
9. Never push without running `npm run build` or `npx tsc --noEmit` first
11. Never launch a client site without `npm run doctor` exiting 0 and Admin → Ecosystem showing it **Connected**
12. Never let middleware be the only authorization gate on a page or route that reads other clients' data — guard server-side too (Security baseline § 6)
10. Never build a custom image modal / lightbox. Use the `react-photo-view` pattern from "Universal interaction patterns." Every NGF site uses the same library — visitors should feel the same interaction across sites.

NGF main app additionally:
- One Prisma instance — always `import { db } from '@/lib/db'`
- `@clerk/nextjs@6` — never `@latest`
- Next.js `15.3.8` — never `16+`
- Never `npx prisma` — always the local binary
- Portal route paths must have `portal-` prefix
- `tsconfig.json` must have `baseUrl` + `paths` or route groups silently 404
- Never put auth checks in layout components — middleware only

---

## Known issues / quick reference

| Issue | Fix |
|---|---|
| Editor sidebar doesn't show a field you annotated | Check both `data-ngf-label` and `data-ngf-section` are present — scraper skips elements missing either |
| Editor sidebar shows an empty input box | Probably an `sr-only` anchor with no inner content — put `{value}` inside the span |
| Image field click does nothing | You used `next/image` with `fill`. Switch to plain `<img>` with `data-ngf-field` directly on it |
| Stored value renders as empty instead of fallback | You used `??` instead of `||`. Empty strings only fall through with `||` |
| Editor preview iframe blocked by browser | Missing `frame-ancestors 'self' https://app.ngfsystems.com https://*.vercel.app` in CSP header |
| Portal editor "site_url not NGF" | Either `NEXT_PUBLIC_SITE_URL` doesn't match `client_configs.site_url`, or your site's HTML doesn't include the `ngf-public-api` meta tag (verify by viewing source) |
| Bridge version mismatch | The bridge file in this repo is older than the editor expects. Re-copy `NgfEditBridge.tsx` from `ngf-client-starter` (the canonical source) |
| Newly-added card looks like a duplicate of the last card | Bridge clones the last child as a template, then resets text to placeholders + image to a grey "Click to set image" SVG. If your site uses non-standard markup the reset may be incomplete; check the bridge's `addGroupItem` handler |
| Custom domain renders only hardcoded defaults | `NEXT_PUBLIC_SITE_URL` Vercel env var doesn't match `client_configs.site_url` exactly (case, www, trailing slash matter). When changing a domain, **both** must change together — see "Site lifecycle" |
| Client's edits "disappeared" after the real domain was set | Almost always the URL pair is out of sync (fix #1 above), not lost data. Content is preserved across `site_url` changes and a restore-point snapshot is in version history. Recovery steps under "Site lifecycle — recovery." Do NOT re-type from scratch — restore first |
| `<select><option>` editing | Not supported by the bridge — native browser UI. Use `data-ngf-field` for the label only |
| Hydration mismatch with `data-ngf-edit` attribute | The bridge sets `data-ngf-edit` on `<html>` only when the parent is the portal iframe. Don't set it server-side |
| Clerk v7 JWT format broken | Pin `@clerk/nextjs@6` |
| Role not appearing in sessionClaims | Customize Clerk session token (see Auth section) |
| Role change not working | User must sign out and back in |
| Prisma pulling v7 | Use `./node_modules/.bin/prisma`, never `npx prisma` |
| Editor sidebar shows TWO entries for the same section | `data-ngf-group` declared on both desktop and mobile responsive containers. Declare once on the desktop container, leave individual item field annotations on both layouts (those dedupe correctly) |
| Nav button text reads as "ConnectLet's connect!" or similar concatenation | Two responsive twin spans both annotated, OR one annotation on a wrapper that contains hidden-text descendants. `el.textContent` walks the full subtree. Consolidate to one DOM element per field path |
| Editor preview button/dropdown styling looks slightly off | Bridge force-reveals hidden state-dependent containers (`opacity-0`, `aria-expanded="false"`, etc.) so they're editable. State-dependent CSS (e.g. dropdown-open border-radius changes) doesn't fire because no real state change occurred. Cosmetic only — published site is unaffected |
| Image upload button returns "Blob storage is not configured" | Vercel Blob token not provisioned. Vercel → ngf-systems-app → Storage → Create Blob → set access **Public** (not Private — image URLs need to be readable from public client sites) → Connect Project → redeploy |
| Pending change appears after just clicking a field with no edits | Old version of the editor's EditPopover. The Cancel/× handler used to write `preEditValue` back unconditionally; current version tracks a dirty flag and skips the write when nothing changed. Pull latest |
| Phantom modifications in `git status` after AI edit session | CRLF/LF line-ending mismatch from Cowork mount writes. Diff every line as `-`/`+` with identical content. Either commit them as a one-time noise commit or `git checkout -- <files>` to discard |
| Sign-in page stalls after CSP added | Clerk uses a custom subdomain (`clerk.<your-domain>`) for its Frontend API on production keys. CSP must explicitly list it in `script-src`, `connect-src`, AND `frame-src` — `*.clerk.com` does NOT cover it. Decode the publishable key (base64 part after `pk_live_`) to find the domain |
| Image gallery feels custom or inconsistent across NGF sites | Don't build a custom lightbox. Use the `react-photo-view` pattern documented under "Universal interaction patterns" — every NGF site uses the same library and the same wrap-with-PhotoProvider pattern |
| Published content takes up to 60s to appear on the live site | The site is caching correctly (`next: { revalidate: 60 }`) but the instant cache-bust isn't firing. Confirm `app/api/revalidate/route.ts` exists on the client site AND `WEBSITE_REVALIDATION_SECRET` matches the value on the NGF main app. With a matched secret, publishes appear sub-second; without it, you fall back to the 60s window |
| `/api/revalidate` returns 401 when the portal publishes | `WEBSITE_REVALIDATION_SECRET` on the client site doesn't match the NGF main app's value (or isn't set). Set both to the same secret and redeploy the client site |
| Neon CU-hours climbing fast for no obvious reason | A client site is still on `cache: 'no-store'` in `getNgfContent()` — every visitor pageview hits Neon. Migrate it to the tagged/revalidating fetch (see "Content caching & revalidation") |
| Vercel rebuilds on every commit including README/docs edits | Missing or misconfigured `vercel.json` `ignoreCommand`. Add the docs-skip script (see "Vercel build cost discipline"). Remember the inverted convention: exit 0 skips, exit 1 builds |

---

## Adding or integrating a feature — the playbook

Read this section when a client asks for something new ("can my site have a booking form / a gallery / a blog / a login area / a map / reviews…") or when any feature or integration must be added to an existing NGF site. It is the decision layer: it tells you *which* pattern to reach for and *what "done" looks like*, then points at the detailed how-to. **Future AI sessions: start here for additions.** Build features by following this playbook — never by inventing a parallel system.

**Golden rule.** Every addition must (a) stay editable from the portal, (b) render correctly before any content is ever published (hardcoded fallbacks), (c) stay inside the security and caching standards, and (d) be tested locally before it ships. If an addition breaks any of those four, it is not done.

### The app ↔ site compatibility contract (non-negotiable)

Every client site is one half of a two-part system; the NGF app (portal editor, schema scraper, content API, edit bridge) is the other half. An addition that works in isolation but violates this contract will break the portal — the client loses the ability to edit, the editor shows duplicates or empty boxes, or content stops publishing. **Anything added to a client site MUST keep all of the following true, and anything added to the NGF app MUST keep supporting them:**

**Every client-site addition must:**
- Expose editable content as **flat dot-notation** the scraper can read — all four `data-ngf-*` attributes present, **one canonical path per value**, **one `data-ngf-group` declaration** per repeatable set, and group paths **exactly two segments deep** (`section.array`). The editor's add/remove/reorder only handle two-segment groups; deeper nesting silently breaks the controls.
- Use **plain `<img>`** for image fields — never `next/image` with `fill`, which wraps the element the bridge needs to reach.
- Read content via `getNgfContent()` with `||` fallbacks and the `next: { revalidate: 60 }` cache — **never `cache: 'no-store'`** — and ship the `/api/revalidate` route (calling `revalidatePath('/', 'layout')`) so publishes propagate.
- Keep `NEXT_PUBLIC_SITE_URL` exactly matching `client_configs.site_url`, mount the verbatim `NgfEditBridge`, and keep the CSP `frame-ancestors` allowance for `app.ngfsystems.com` so the editor iframe loads.
- Be confirmed live in the portal editor (the "verify in editor" step). If a new field doesn't appear there, it is not compatible yet — it is not done.

**When an addition needs capability the portal doesn't have yet** — a new field *type* beyond `text` / `textarea` / `color` / `image`, a content shape the scraper can't express, a new editable surface (e.g. blog posts), or anything the editor would need new UI for — **that is a coordinated NGF-app change, not a client-site-only change.** Update the NGF app (scraper, bridge contract, editor, content API as needed) **and** this standards file together, then build the client-site feature against the now-supported capability. Never ship a client-site feature that assumes portal support that doesn't exist: it will look fine on the live site and be uneditable in the panel.

**On the NGF-app side:** any change to the editor, scraper, bridge, content API, or publish flow must stay backward-compatible with every already-deployed client site — or every affected site must be migrated in the same release. The app and the standards move together: if you change the contract in the code, change it in this doc, and vice versa.

### Building a new structured collection (blog, products, bookings, events…)

Most "features" are page content — fixed fields you annotate with `data-ngf-*` and read with `|| fallback` (Step 0 below makes the call). But a **structured collection** — a variable-length list the client adds/removes/reorders (blog posts, products, bookings, calendar events, team members) that the current editor can't express — is a **coordinated NGF-app change**, per the contract above. When you build one, it MUST satisfy this contract so it inherits the editor, cache, versioning, and SEO instead of becoming a one-off:

1. **Data, keyed by `client_id`.** A new model in the NGF Prisma schema (or the client's own external DB for client-owned operational data like bookings). Mirror the `website_content` pattern: a published state, an optional draft, and a **version snapshot on publish** (like `website_content_versions`) so edits are revertible. Multi-tenant queries always filter by `client_id` at the ORM level.
2. **A feature flag in `client_configs`.** Gate the whole surface on a boolean (`feature_blog`, `feature_products`, `feature_booking`, `feature_gallery` exist; add new ones as needed). The portal renders the surface only when the flag is on; the public API returns empty when off.
3. **A public read API under `/api/public/*`.** Same domain resolution as `getNgfContent()` (match by normalized `site_url`), full CORS, **no auth**, and **return `{}` / `[]` when empty** so the site falls through to its hardcoded defaults instead of 404ing. List + single-item endpoints (e.g. `/api/public/articles?domain=…` and `…/articles/<slug>`).
4. **Client-site rendering with the shared cache.** Fetch with the same ISR cache as content — `fetch(url, { next: { revalidate: 60, tags: ['ngf-content'] } })` — busted by the same `/api/revalidate` on publish. Never `cache: 'no-store'`; always `||` fallbacks. Emit the right JSON-LD (`Article`/`BreadcrumbList` for posts, `Product`/`Offer` for shop, `Event` for calendar) + per-page `metadata`.
5. **An editor surface that reuses the publish model.** Edits flow **draft → publish → push → revalidate**, exactly like the website editor, obeying the security invariants (identity from session, scope to `client.id`, role re-checked, never trust a `client_id` from input).
6. **Sitemap wiring.** Dynamic URLs (blog slugs, product pages) must be emitted by `app/sitemap.ts` or they're invisible to Google.
7. **The full security baseline applies** — input validation, prototype-pollution stripping, SSRF guards, webhook verification, secrets never `NEXT_PUBLIC_`, and Image-upload safety for any upload.

The payoff: the feature inherits the draft/publish/revert UX, the 60s ISR + instant cache-bust, the domain-resolution plumbing, version history, and the SEO surface — instead of a one-off that "works on one site but not another." Planned instances (blog, auto-generated structured data) live in the Roadmap below.

### Booking / appointments — the built native module (integrate, don't rebuild)

Native scheduling is **built** — a structured collection per the rules above: data in the central NGF DB keyed by `client_id`, gated by `feature_booking`. **Never rebuild a per-site booking system and never reuse the legacy external-DB / service-request pattern** (one early site has its own Neon DB for service requests; that approach is deprecated and must not be copied). A client site *integrates* this module; it does not implement scheduling itself. (Delivered on `NGF-Systems-app` `feat/booking-v1` + `ngf-client-starter` `feat/booking-widget`; internal design doc `BOOKING-V1-SPEC.md`. Merge those before relying on it.)

**Data model (central NGF DB, single-provider MVP; `provider_id` reserved for multi-staff):** `BookingConfig` (per client: `timezone`, `slot_interval_min`, `lead_time_min`, `max_advance_days`, `buffer_min`, `enabled`), `AvailabilityRule` (weekly hours), `BlackoutDate` (closed ranges), `Service` (name/duration/price), `Appointment` (customer + `start_at`/`end_at` **UTC** + `status` SCHEDULED|COMPLETED|CANCELLED|NO_SHOW|LATE + `cancelled_by` + `manage_token`). All times stored UTC; the business timezone lives on `BookingConfig`.

**Public API (domain-resolved, CORS `*`, no auth — same resolution as `getNgfContent()`):**
- `GET /api/public/availability?domain=&date=YYYY-MM-DD&serviceId=` → `{ timezone, services:[{id,name,duration_min,price_cents}], slots:[{startUtc,label}] }`. Omit `date` to fetch just services + timezone.
- `POST /api/public/bookings` → `{ domain, serviceId, startUtc (ISO), customer:{name,email,phone}, notes, _gotcha }` → `{ ok, appointment:{id,startUtc,label} }`. **Persist-first**; double-booking prevented server-side (Serializable txn + partial-unique slot index) → **409** on a race. Honeypot field `_gotcha` must stay empty.
- `GET/POST /api/public/bookings/manage?token=` → customer view/cancel via the emailed `manage_token`. Cancel reopens the slot and emails the owner.

**Client-site integration (all a site does):**
- Drop in the starter's `<BookingWidget base={} domain={} />`; get `base`/`domain` from `ngfEndpoints()` in `lib/ngf.ts` (`NGF_APP_URL` + normalized `NEXT_PUBLIC_SITE_URL`).
- Ship `/book` (widget) and `/book/manage` (customer self-manage, reads `?token=`) — copy from the starter.
- **No `data-ngf-*` annotations needed for booking** — availability/services come from the portal API, not the content editor. Standard env + CSP already cover it.
- `feature_booking` must be ON in the client's config for the endpoints to return data and the portal surface to appear.

**Owner experience:** availability, services, blackout dates, and every appointment (upcoming/past; complete / late / no-show / cancel / reschedule) are managed at `/portal/portal-booking` (gated by `feature_booking`). Owner cancel/reschedule emails the customer; a customer self-cancel emails the owner and shows a "Cancelled by customer" badge.

**Core invariant (fixes the old system's #1 bug):** a slot is open *iff* it's inside an availability window with no overlapping `SCHEDULED` appointment — **openness is computed, never stored** — so any cancel/reschedule/no-show reopens that time automatically. Only `SCHEDULED` blocks a slot.

**Phase 2 (not built):** SMS confirmations/reminders (Twilio + Vercel Cron), customer self-*reschedule* (cancel + rebook works today), multi-staff, deposits, Google Calendar sync.

### Step 0 — Pick the NGF pattern before writing any code

Map the request to a known pattern. Almost every ask is one of these:

| Client wants… | NGF approach | Detailed section |
|---|---|---|
| To edit some text/image themselves | Editable field — `data-ngf-*` annotation + `||` fallback | "Self-describing markup" |
| A list they can add/remove/reorder (services, team, projects) | Repeatable group — `data-ngf-group` | "Repeatable groups" |
| A photo gallery / many images | Repeatable group + `react-photo-view` lightbox | "Large galleries", "Universal interaction patterns" |
| A contact / inquiry form | Server route + Resend + Zod validation | Recipes below |
| A booking calendar / appointments | **Native booking module** (`feature_booking`) — integrate the built feature, never rebuild | "Booking / appointments" |
| Quote requests / custom request flows | Its own DB table + tokenized public links | Recipes below |
| A blog / news / articles | Planned feature — not yet built; follow the agreed architecture | "Roadmap" |
| A login area (customer or staff) | Clerk v6 | "Auth" + recipe below |
| A map, calendar, chat widget, embed, any third-party script | Third-party integration (CSP + env) | Recipes below |
| A new page | New route + `metadata` + sitemap entry | Recipes below |
| Reviews/testimonials shown + in search results | Repeatable group + `AggregateRating`/`Review` JSON-LD (only if real) | SEO § "Expanding structured data" |

If the ask fits no pattern, stop and design it against the four principles (editable, fallback, secure, cached) before coding — do not improvise a one-off.

### Step 1 — The universal build sequence (any addition, in this order)

1. **Check it doesn't already exist.** Search the repo for the component/route/field first — never duplicate.
2. **Data first.** Needs stored data? Model it (Drizzle on client sites, Prisma on the main app), scoped by `client_id`, and generate the migration. Just editable content? Decide the `data-ngf-field` paths — one canonical path per piece of data, never duplicated.
3. **Server route second** (if needed). Validate every input with Zod. Follow the security baseline: identity from session, scope every query to `client.id`, re-check `role` inside `/api/*` handlers. If it accepts uploads, follow Image-upload safety.
4. **UI last.** Render with hardcoded fallbacks (`content['key'] || 'default'` — always `||`, never `??`). Annotate every new editable element with all four `data-ngf-*` attributes. Mobile-first, Tailwind only, server components by default.
5. **SEO.** New page → add it to `app/sitemap.ts` and give it `metadata`. New business info → update the structured data.
6. **Security / CSP.** New third-party origin → add it to the CSP (`script-src` / `connect-src` / `frame-src` as appropriate). New secret → server-only env var, never `NEXT_PUBLIC_`.
7. **Test locally** (`npm run dev`), then `npx tsc --noEmit` and `npm run build`. Exercise the unhappy paths, not just the happy one.
8. **Verify in the editor** — open the portal, confirm the new editable fields show up in the sidebar with real preview text.

### Step 2 — Recipes for the common asks

**Editable content region.** Annotate the element with all four attributes; read `content['section.field'] || 'fallback'`. One canonical path per piece of data, reused everywhere it appears. See "Self-describing markup."

**Repeatable list / gallery.** `data-ngf-group="section.items"` on the container — exactly two path segments, declared once (not on both responsive layouts). Declare `data-ngf-item-fields`, render with indexed paths, read with `getItems(content, 'section.items')`. Wrap image sets in `<PhotoProvider>`. See "Repeatable groups" and "Large galleries."

**Contact / inquiry form.** Use **`<LeadForm>`** from the starter, pointed at the central lead store. A new site has **no form API route and no Resend key of its own** — the store persists first, then sends the notification from the verified NGF sender, so a failed email can no longer lose the enquiry, and every submission shows up in the client's **Form Submissions** portal page.

```tsx
<LeadForm base={base} domain={domain} formType="contact" fields={[…]} />
```

Only when **retrofitting a site that already has a working form**, keep its route and call `relayLeadToNgf()` *before* the existing send — additive, never throws, existing email and UX unchanged.

> **A bespoke Resend-only route or server action is non-conformant.** The route form fails `npm run doctor`; the **server-action** form is worse — the doctor only scans `app/api/**/route.ts`, so it passes while losing every enquiry. See "Lead capture: persist first, email second".

The honeypot is mandatory and must be **non-semantic** — `_gotcha`, never `company`/`website`/`address2`. Browsers autofill by field name, so a semantic honeypot gets filled by real users and their enquiry is silently discarded. Labels/headings can be `data-ngf-*` editable; native `<select>` *options* are not bridge-editable (see Known Issues).

**Features that need their own data (service requests, quotes).** *(Booking is NOT one of these — use the native module above.)* Give the client site its **own** Neon DB via Drizzle, tables scoped by `client_id`. For customer-facing flows where the customer has no account, use **tokenized public links** (random token + TTL, validated server-side) and whitelist those routes in middleware. Schema changes live in the **client site repo**, not the main app; record any migration you can't verify live in that repo's Known Gaps.

**Auth area (customer or staff login).** Clerk v6 (`@clerk/nextjs@6` — never `@latest`). Customize the session token for roles, let middleware handle all auth (never in layout components), whitelist public/tokenized routes. Remember the Clerk custom-domain CSP carve-out on production keys. See "Auth."

**Third-party integration (maps, embeds, scripts, external APIs).** Three things, every time: (1) add the origin to the CSP — `script-src` for scripts, `connect-src` for fetch/XHR, `frame-src` for iframes/embeds; (2) keys go in server-only env vars unless the provider's key is explicitly public (then `NEXT_PUBLIC_` is fine, e.g. a GA measurement ID); (3) load scripts with `next/script` and an appropriate `strategy`. Re-run the security checklist afterward.

**New page.** New route folder + `page.tsx` with its own `metadata`; add the URL to `app/sitemap.ts`; link it in nav (annotate the label if it should be editable); confirm 375 / 768 / 1280.

**Blog / articles.** Not yet built — a planned standard. Do not hand-roll a one-off; follow "Roadmap → Blog / articles" and the structured-collection contract above so every site's blog lands the same way.

### Step 3 — Definition of done (gate every addition against this)

An addition is done only when **all** of these are true:

- [ ] Editable pieces are annotated (all four `data-ngf-*` attrs) and appear in the portal editor
- [ ] Every dynamic value has a hardcoded `||` fallback; the site renders correctly with zero published content
- [ ] Inputs are validated server-side (Zod); routes follow the security invariants; uploads follow Image-upload safety
- [ ] Any new third-party origin is in the CSP; any new secret is server-only (no `NEXT_PUBLIC_`)
- [ ] New pages are in `app/sitemap.ts` with `metadata`; structured data updated if business info changed
- [ ] Works at 375 / 768 / 1280; Tailwind only; server components by default
- [ ] `npx tsc --noEmit` and `npm run build` pass; unhappy paths tested locally
- [ ] Verified in the portal editor; content caching left as `next: { revalidate: 60 }` (never `no-store`)

If you cannot check every box, state which are unchecked rather than calling it done.

---

## Roadmap — planned standards (not yet built)

Items here are **agreed direction but not yet implemented.** Don't treat them as current standards — they're captured so that when they're built, they're built consistently across every repo. When an item ships, promote it up into the body of this doc and delete it from here.

### Blog / articles in the portal editor

**Goal:** let clients publish blog posts / articles from the NGF portal the same way they edit page content today — no developer in the loop. Blogging is a strong local-SEO lever (fresh, keyword-rich, internally-linked content) and a natural upsell on the $120/mo plan.

**Intended architecture (consistent with the existing editor model):**

- **Storage:** a new `Article` model in the NGF main-app Prisma schema, keyed by `client_id` — `title`, `slug`, `excerpt`, `body` (rich text / MDX-ish), `cover_image`, `status` (draft/published), `published_at`, `seo_title`, `seo_description`. Version-snapshot on publish like `websiteContentVersion`.
- **Public API:** extend the public content API with `/api/public/articles?domain=…` (list) and `…/articles/<slug>` (single), using the same domain-resolution as `getNgfContent()`.
- **Client-site rendering:** `/blog` index + `/blog/[slug]` detail pages, fetched with the same tagged/revalidating cache (`next: { revalidate: 60, tags: ['ngf-content'] }`) and busted by the same `/api/revalidate` on publish. Each article page emits `Article` + `BreadcrumbList` JSON-LD and its own per-page `metadata`.
- **Editor UX:** a "Blog" surface in the portal — list of posts, create/edit with a rich-text editor, draft vs. publish, cover-image upload through the existing Sharp pipeline. Reuse the publish → push → revalidate flow already in place.
- **Sitemap:** the client `app/sitemap.ts` must pull published article slugs so new posts get indexed.

**Why it's a product build, not just a doc change:** it needs a schema migration, new API routes, a new editor surface, and client-site templates. Scope it as its own project. When shipped, promote this into a "## Blog" section near SEO and add `Article` to the structured-data section.

### Auto-generated structured data from `client_configs`

A `<StructuredData client={config} />` component that emits complete `LocalBusiness` + `Service` + `AggregateRating` JSON-LD from the client's NGF config, replacing hand-authored markup and eliminating NAP drift. Detailed under SEO & analytics § "4b. Expanding structured data."

### Package the editor integration as `@ngf/editor-bridge`

**Status: mostly solved by `sync-ngf`. This entry is now about the remaining 20%.**

The original problem — every site hand-copying `NgfEditBridge.tsx` + `lib/ngf.ts`, so a contract change meant re-copying into N repos while stale copies silently broke edit mode — is addressed:

- **`npm run sync-ngf`** pulls every canonical file from `ngf-client-starter`.
- **`NGF_BRIDGE_VERSION`** is exported from the bridge, so a copy's provenance is checkable.
- **`npm run sync-ngf:check`** exits non-zero on drift, so CI can gate it.
- **`npm run doctor`** fails a stub or truncated bridge and warns on a pre-versioning copy.

**What a real package would still add:**
1. **Semver resolution** — `^1.2.0` picks up compatible fixes automatically. `sync-ngf` always takes the tip of `main` unless you pass `--ref`, so there is no "compatible updates only" mode.
2. **Server-side version awareness** — the portal cannot currently see which bridge version a site runs. Emitting `NGF_BRIDGE_VERSION` into a meta tag would let Admin → Ecosystem flag incompatible sites without cloning them; that is the cheap next step and does not need a registry.
3. **A dependency graph** — `npm ls` would show bridge versions across sites; today you run `sync-ngf:check` per repo.

**Do this before reaching for a registry:** roll `sync-ngf` out to all client repos and add `npm run sync-ngf:check` to CI. That captures most of the value at none of the publishing overhead.

---

## Reference implementation

There is exactly one canonical reference, kept current as the editor evolves:

- **[`ngf-client-starter`](https://github.com/Nick-NGFsystems/ngf-client-starter)** — the canonical client-site reference. Holds the authoritative `NgfEditBridge.tsx`, `lib/ngf.ts`, CSP/`next.config`, `app/api/revalidate/route.ts`, `vercel.json`, and fully-annotated example sections covering every field type and pattern in this doc. **Copy integration files from here, never from a live client site** (client copies drift). When the editor contract changes, this is the one repo that gets updated first.
- **[`NGF-Systems-app`](https://github.com/Nick-NGFsystems/NGF-Systems-app)** — the admin portal itself. Read its [`CLAUDE.md`](https://github.com/Nick-NGFsystems/NGF-Systems-app/blob/main/CLAUDE.md) when integrating new editor features (full bridge + scraper architecture, security invariants, version history).

Individual client sites are **not** reference material — anything project-specific lives in that project's own `CLAUDE.md`, never in this universal standard.

---

## Workflow — how we build a feature

1. **Read** this file + the project's own `CLAUDE.md` if present
2. **Check** if the feature, component, or route already exists
3. **Schema first** if data is involved — update `prisma/schema.prisma` (main app) or `db/schema.ts` (Drizzle), generate the migration
4. **API route** second
5. **UI component** last
6. **Annotate** every new editable text/image with the four `data-ngf-*` attributes
7. **Verify** every file you wrote with `cat` after editing — never trust silent writes
8. **Build** — `npm run build` or `npx tsc --noEmit` to confirm no TS errors
9. **Commit + push** in one call via `python3 github-push.py <repo-name> "<commit message>"` — the script handles staging, commits with the descriptive message you pass (use `feat:` / `fix:` / `docs:` prefixes), and pushes via the GitHub Git Data API. Vercel auto-deploys (or skips, per the `vercel.json` ignore rules)

---

## Deployment checklist (Vercel)

Before deploying any new NGF client site:

- [ ] Framework Preset: **Next.js** (Vercel usually detects)
- [ ] Env vars set: `NEXT_PUBLIC_SITE_URL` matches NGF database, `NEXT_PUBLIC_GA_ID`, `WEBSITE_REVALIDATION_SECRET` (same value as NGF main app), plus whatever else the site needs (DB, Resend, Clerk)
- [ ] `vercel.json` with `ignoreCommand` committed (docs-only commits skip the build)
- [ ] `app/api/revalidate/route.ts` present (publishes bust the content cache instantly)
- [ ] CSP `frame-ancestors` header in `next.config`
- [ ] Custom domain DNS records configured at the registrar
- [ ] After first successful deploy: in NGF admin → Clients → set this client's `site_url` to match
- [ ] Open the client's portal editor — verify all annotated fields appear in the sidebar with real preview text
- [ ] SEO launch gate passed (SEO & analytics § 8) — **hard blocker, do not flip live without it**

For the NGF main app additionally:
- [ ] Clerk production instance has session token customized + domain verified
- [ ] All Clerk + Stripe + Resend + Neon env vars added to Production / Preview / Development
- [ ] Vercel Blob store provisioned and `BLOB_READ_WRITE_TOKEN` available (image uploads from the editor need this)
