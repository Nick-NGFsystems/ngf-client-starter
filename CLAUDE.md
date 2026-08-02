# [Client Name] — NGF Client Site

This repo was scaffolded from `ngf-client-starter`. The NGF portal editor at `app.ngfsystems.com` is wired up on day one — every editable element on every page can be managed by the client without a code change.

## Read this first

The universal foundation for every NGF client website lives at:

- **Canonical URL:** https://raw.githubusercontent.com/Nick-NGFsystems/NGF-Systems-app/main/NGF-STANDARDS.md
- **Never keep an in-repo copy.** Always fetch the canonical URL above — a repo-local `NGF-STANDARDS.md` is stale by definition.

That doc has:

- Tech-stack rules (client sites use latest stable; only `NGF-Systems-app` itself is pinned)
- The full NGF portal editor integration spec (`lib/ngf.ts`, `NgfEditBridge`, `data-ngf-*` attribute reference for every field type)
- Setup checklist for a new site
- Known issues + every gotcha we've shipped
- Reference implementation: **this repo**. Do not copy integration files from a live client site.

**Read it before you write any code.** This file only covers project-specific overrides.

---

## Setup checklist (complete when forking this repo)

- [ ] Rename the repo to the client's project name
- [ ] Update `package.json` `name` field
- [ ] **`npm run sync-ngf`** — pull the canonical bridge / `lib/ngf.ts` / `LeadForm` / `CookieConsent` / doctor. Do this first and never hand-edit what it writes.
- [ ] Keep `metadata.other['ngf-public-api']` in `app/layout.tsx` — without a binding marker the admin cannot set this client's `site_url` (422) and the site can never be attached to a portal account
- [ ] Update `app/layout.tsx` `metadata` with the client's business name
- [ ] Set `NEXT_PUBLIC_SITE_URL` in Vercel env vars to the client's domain
- [ ] Set `NGF_APP_URL` (optional — defaults to `https://app.ngfsystems.com`)
- [ ] Set `WEBSITE_REVALIDATION_SECRET` (must match the value in the NGF app)
- [ ] Customize brand colors in `app/globals.css` CSS variables
- [ ] In the NGF admin portal, set this client's `site_url` field to match `NEXT_PUBLIC_SITE_URL` exactly (case, www, trailing slash all normalized)
- [ ] Deploy to Vercel
- [ ] Open the client's portal editor — verify every annotated field shows up in the sidebar with real preview text

---

## What's already wired up

| File | Purpose |
|---|---|
| `lib/ngf.ts` | `getNgfContent()` + `getItems()` — server-side fetch of published content from the NGF portal. Don't modify. |
| `components/NgfEditBridge.tsx` | Bridge between the iframe-embedded site and the portal editor. **Never hand-edit, and never copy it from a client site** — run `npm run sync-ngf`. It exports `NGF_BRIDGE_VERSION`; `npm run doctor` reads it and `npm run sync-ngf:check` fails on drift. THIS repo is the canonical source. |
| `app/layout.tsx` | Mounts `<NgfEditBridge />` and calls `getNgfContent()` once per page load |
| `next.config.ts` | CSP `frame-ancestors` header so the portal editor can iframe the site |
| `app/api/revalidate/route.ts` | Optional webhook the NGF portal pings after publish (uses `WEBSITE_REVALIDATION_SECRET`) |

---

## Adding new editable content

The full reference is in NGF-STANDARDS.md → "Self-describing markup — annotation patterns". Short version:

1. Add a hardcoded fallback wherever the value is rendered:
   ```tsx
   const headline = content['hero.headline'] || 'Default headline'
   ```
   **Always use `||`, never `??`.** Empty strings only fall through with `||`.

2. Render the element with all four `data-ngf-*` attributes:
   ```tsx
   <h1
     data-ngf-field="hero.headline"
     data-ngf-label="Headline"
     data-ngf-type="text"
     data-ngf-section="Hero"
   >
     {headline}
   </h1>
   ```

3. Deploy. The editor sidebar picks it up automatically — there is no schema file to maintain. The portal scrapes the live HTML on every editor load and builds the sidebar dynamically.

For **images**, use a plain `<img>` (NOT `next/image` with `fill` — the bridge can't reach the underlying element through the wrapper). For **repeatable groups** (cards the client can add/remove/reorder), put `data-ngf-group` on the container — see the foundation doc.

---

## ⚠ Note: legacy `site/` subdirectory

The starter repo has a parallel copy of the app under `site/` from when the layout was a monorepo-y single-deploy structure. **Active development should happen at the repo root.** The `site/` subdir stays in sync via the starter's update process but isn't where you should edit. If you fork this starter, consider deleting the `site/` subdir entirely and configuring Vercel's Root Directory back to `.` (the default).

---

## Known Gaps / Integration Checklist

When finishing a session, add or update an entry here for anything you committed but couldn't verify live.

| Area | Status | Notes |
|---|---|---|
| Bridge version | ✅ Canonical | This repo IS the source of truth (v1.0.0). Client sites run `npm run sync-ngf` to pull from here. Never sync in the other direction — an audit found 7 of 9 live sites on a drifted bridge, caused by the old copy-from-a-reference-site instruction. |
| `template_id` references | ✅ Removed | This field is deprecated in the NGF database (schema is now scraped from the live site). The starter no longer mentions it. If you see `template_id` in any other doc, that doc is stale. |
| Legacy `site/` subdirectory | ⚠️ Drifting risk | Same files exist at the repo root and under `site/`. Active edits should go at the root. Vercel deploy can target either; pick one and stick with it. |

---

## Project-specific notes

(Anything unique about THIS client site that an agent would otherwise have to discover by audit goes below this line.)
