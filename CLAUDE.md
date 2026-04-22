# [Client Name] — Project Notes

This file covers project-specific details. For universal NGFsystems standards, see `../CLAUDE.md`.

The Next.js app lives in this `site/` directory. Run all commands from here.

---

## What This Project Is

A standalone Next.js 15 client website scaffolded from `ngf-client-starter`. Content is managed by the client through their NGF portal.

**Template ID:** `generic` (set in NGF admin → client config → template_id)

---

## Setup Checklist (complete when forking this repo)

- [ ] Rename the repo to the client's project name
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the client's domain in Vercel env vars
- [ ] Set `WEBSITE_REVALIDATION_SECRET` (same value as in NGF app)
- [ ] In NGF admin, set `site_url` to the client's domain and `template_id` to `generic`
- [ ] Customize brand colors in `app/globals.css` CSS variables
- [ ] Update `export const metadata` in `app/layout.tsx` with the client's business name
- [ ] Deploy to Vercel — set Root Directory to `site/` in Vercel project settings

---

## Content Fields (generic template)

Fields are defined in `lib/templates/generic.ts` in the NGF-Systems-app repo. Current sections:

| Section | Fields |
|---|---|
| `hero` | `headline`, `subheadline`, `ctaText`, `ctaLink` |
| `about` | `title`, `body` |
| `services` | `title`, `items[].title`, `items[].description` |
| `gallery` | `title`, `photos[].url`, `photos[].caption` |
| `contact` | `phone`, `email`, `address`, `hours` |
| `brand` | `businessName`, `tagline`, `primaryColor`, `secondaryColor` |

To add a new field: update `lib/templates/generic.ts` in NGF app AND add `data-ngf-field` + `getNgfContent()` usage in `app/page.tsx` here.

---

## Environment Variables

```
# Required
NEXT_PUBLIC_SITE_URL=https://clientdomain.com
WEBSITE_REVALIDATION_SECRET=<must match NGF app env var>

# Optional override
NGF_APP_URL=https://app.ngfsystems.com
```

---

## Project Structure

```
site/
  app/
    layout.tsx              ← includes NgfEditBridge — do not remove
    page.tsx                ← homepage — fetches all NGF content
    globals.css             ← Tailwind + CSS brand color variables
    api/
      revalidate/route.ts   ← NGF publish webhook
  components/
    NgfEditBridge.tsx        ← do not remove
    layout/SiteHeader.tsx
  lib/
    ngf.ts                  ← getNgfContent(), getItems()
```
