# [Client Name] — NGF Client Site

This repo was scaffolded from `ngf-client-starter`. The NGF portal editor at `app.ngfsystems.com` is wired up on day one — every editable element on every page can be managed by the client without a code change.

## Read this first

The universal foundation for every NGF client website lives at:

- **Canonical URL:** https://raw.githubusercontent.com/Nick-NGFsystems/ngf-client-starter/main/NGF-STANDARDS.md
- **Never keep an in-repo copy.** Always fetch the canonical URL above — a repo-local `NGF-STANDARDS.md` is stale by definition.

That doc has:

- Tech-stack rules (client sites use latest stable; only `NGF-Systems-app` itself is pinned)
- The full NGF portal editor integration spec (`lib/ngf.ts`, `NgfEditBridge`, `data-ngf-*` attribute reference for every field type)
- Setup checklist for a new site
- Known issues + every gotcha we've shipped
- Reference implementation: **this repo**. Do not copy integration files from a live client site.

**Read it before you write any code.** This file only covers project-specific overrides.

---

## Working here as a teammate

NGF is Nick (the owner) plus teammates who work through Claude Code. These rules hold in every session.

- **Always a branch.** Start a `claude/<short-name>` branch from a fresh `origin/main`. Never commit or push to `main`: on a client repo a push to `main` deploys the client's live site (in this starter, `main` is what every client's `npm run sync-ngf` pulls).
- **PR, then preview.** Push your branch (`git push -u origin <branch>`), open a PR, and check its Vercel preview. Say in the PR what you checked and what you could not.
- **Nick merges.** He reviews every PR and merges it. Don't merge, promote a preview, or run `vercel --prod`. The `github-push.py` recipe in NGF-STANDARDS.md is Nick's tool, not part of this flow.
- **No real secrets in the repo.** No real env values, API keys or tokens in code, `NOW.md` or a PR. Real values live in Vercel; `.env.local` stays on your machine.
- **No real emails or texts while testing.** Lead forms, bookings and orders send real email and SMS to the client and their customers. Don't submit a real form, booking or order to test, live or on a preview; ask Nick for test mode or the testbed.
- **`NOW.md` first.** Read it at the start. It is the project's state in under ~15 lines: status, what's live, next step, what it waits on, open branches/PRs. Overwrite it, never append (git is the history). Say **"wrap up"** at the end and Claude updates `NOW.md` on your branch, commits and pushes.
- **Work items live in the NGF app.** A client's to-dos are Project steps in the NGF app. Take the step before you start; when you stop, hand it back with a short "where it's at" note (done, what's left, what's blocked).

**Client in the NGF app.** Every client repo carries this line (fill it in when forking):

`NGF client id: <fill in>`

Once `client_brief` is available in the `ngf-systems` MCP: at the start of a session, if that MCP is connected, call `client_brief` with this id for the client's people, open steps and requests.

---

## Setup checklist (complete when forking this repo)

- [ ] Rename the repo to the client's project name
- [ ] Update `package.json` `name` field
- [ ] Fill in `NGF client id` under "Working here as a teammate", and add a `NOW.md`
- [ ] **Delete `NGF-STANDARDS.md` from your fork.** It is canonical *here* and stale everywhere else — always fetch the raw URL. `npm run doctor` fails if a fork keeps a full copy.
- [ ] **Check `vercel.json` has no `"git": { "deploymentEnabled": false }`** — that key belongs only to the template repo, and a fork that inherits it silently never deploys
- [ ] **`npm run sync-ngf`** — pull the canonical bridge / `lib/ngf.ts` / `LeadForm` / `CookieConsent` / doctor. Do this first and never hand-edit what it writes.
- [ ] Keep `metadata.other['ngf-public-api']` in `app/layout.tsx` — without a binding marker the admin cannot set this client's `site_url` (422) and the site can never be attached to a portal account
- [ ] Update `app/layout.tsx` `metadata` with the client's business name
- [ ] Set `NEXT_PUBLIC_SITE_URL` in Vercel env vars to the client's domain
- [ ] Set `NGF_APP_URL` (optional — defaults to `https://app.ngfsystems.com`)
- [ ] Set `WEBSITE_REVALIDATION_SECRET` — mint it on the client's hub (Website → Advanced) and set it on the Vercel project for **production AND preview**, then redeploy; the hub's **Verify publish** proves it landed
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
| `app/api/revalidate/route.ts` | **Required.** The portal pings it after every publish, reset and revert. Missing, or `WEBSITE_REVALIDATION_SECRET` unset, and the hub shows the client as degraded while content waits out the 60s cache window |

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

## Known Gaps / Integration Checklist

When finishing a session, add or update an entry here for anything you committed but couldn't verify live.

| Area | Status | Notes |
|---|---|---|
| Bridge version | ✅ Canonical | This repo IS the source of truth (v1.0.0). Client sites run `npm run sync-ngf` to pull from here. Never sync in the other direction — an audit found 7 of 9 live sites on a drifted bridge, caused by the old copy-from-a-reference-site instruction. |
| `template_id` references | ✅ Removed | This field is deprecated in the NGF database (schema is now scraped from the live site). The starter no longer mentions it. If you see `template_id` in any other doc, that doc is stale. |

---

## Project-specific notes

(Anything unique about THIS client site that an agent would otherwise have to discover by audit goes below this line.)
