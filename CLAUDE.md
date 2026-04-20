# NGFsystems — AI Rules & Project Standards

This file defines the rules, stack, and conventions for all NGFsystems projects.
All AI tools must follow these rules exactly. Do not deviate from this stack.
Do not install unlisted libraries without explicit approval.
When in doubt, refer back to this file before writing any code.

---

## Stack — Always Use These Exact Versions, Nothing Else

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.3.8 |
| Runtime | React | 18.x |
| Language | TypeScript | always, never plain JS |
| Styling | Tailwind CSS | 3.x |
| Database | Neon (PostgreSQL) | latest |
| ORM | Prisma | 5.x |
| Auth | Clerk | @clerk/nextjs v6 |
| Payments | Stripe | latest |
| Deployment | Vercel | — |
| Version Control | GitHub | — |

### Critical Version Rules
- **Never install Next.js 16+** — always pin to 15.3.8
- **Never install React 19+** — incompatible with Next.js 15
- **Never install Prisma 6+** — breaking changes in schema syntax
- **Never install `@clerk/nextjs@latest`** — installs v7 which has breaking JWT changes. Always pin with `@clerk/nextjs@6`
- **Never enable Turbopack** — never use `--turbopack`, never add it to any script or config
- **Always run Prisma via local binary** — `./node_modules/.bin/prisma` not `npx prisma` (npx downloads Prisma 7 globally)

---

## NGFsystems Ecosystem Overview

NGFsystems consists of two types of projects:

**1. The NGF App** (`NGF-Systems-app`) — a single Next.js app on Vercel with one Neon Postgres database. Two completely separate experiences gated by Clerk roles:
- Admin side (`/admin`) — accessible only to the NGFsystems owner (role: `"admin"`)
- Client portal (`/portal`) — accessible only to clients (role: `"client"`)

**2. Client Sites** — standalone Next.js projects, each deployed as their own Vercel project. They are not hosted through the NGF app. Each client site connects to the NGF app for content management only, fetching published content via the NGF public content API.

New client sites are scaffolded from the `ngf-client-starter` boilerplate repo.

---

## Client Site Architecture

### Content flow
```
Client edits text in NGF portal → saves draft → publishes
  → NGF stores in websiteContent.content (JSON)
  → GET /api/public/content?domain=<client-domain>
  → returns flat dot-notation: { 'hero.headline': '...', 'services.items.0.title': '...' }
  → client site fetches on every request (cache: no-store)
  → renders with fallback defaults
```

### lib/ngf.ts (required in every client site)
- `getNgfContent()` — fetches flat dot-notation content from the NGF API using the site's own domain
- `getItems(content, prefix)` — extracts a repeatable array (e.g. `getItems(content, 'services.items')`)
- Always provide fallback values via `??` — if NGF is unreachable, the site shows sensible defaults

### NgfEditBridge (required in every client site layout)
A `'use client'` component that enables the NGF portal's live preview and click-to-edit:
- Signals ready to the portal editor (`ngfReady` postMessage)
- Receives `contentUpdate` messages and patches DOM elements with matching `data-ngf-field` attributes
- Sends `fieldClick` messages when an annotated element is clicked in edit mode
- Elements annotated: `<h1 data-ngf-field="hero.headline">{headlineText}</h1>`
- **Never remove NgfEditBridge from a client site's layout.tsx**

### Template system (in NGF app)
`lib/templates/` defines the schema that drives the portal editor. Each client has a `template_id` on their `client_configs` record. To add a new content field to a client site:
1. Add the field to the template schema in `lib/templates/` in the NGF app
2. Read the field in the client site: `content['section.fieldKey'] ?? 'default'`
3. Add a matching `data-ngf-field` attribute to the rendered element
4. Push both repos

### CSP header (required in every client site next.config.ts)
```typescript
{ key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://app.ngfsystems.com https://*.vercel.app" }
```
This allows the NGF portal to embed the client site in an iframe for live preview.

### Revalidation endpoint (required in every client site)
`app/api/revalidate/route.ts` — the NGF portal pings this after a client publishes. Validates `WEBSITE_REVALIDATION_SECRET`. Returns 200.

### Environment variables (every client site needs)
```
NEXT_PUBLIC_SITE_URL=https://clientdomain.com
NGF_APP_URL=https://app.ngfsystems.com
WEBSITE_REVALIDATION_SECRET=<match the one set in NGF app>
```

---

## Folder Structure — Every Project Follows This

```
/app
  /layout.tsx               → Root layout. Client sites include NgfEditBridge here.
  /(auth)                   → Login, signup pages
    /layout.tsx             → Required for route group to work
    /sign-in/page.tsx
    /sign-up/page.tsx
  /api
    /public/                → Public CORS endpoints (no auth)
    /webhooks/              → Webhook handlers
/components
  /ui                       → Generic reusable elements
  /layout                   → Navbars, headers, footers
/lib
  /db.ts                    → Prisma client — single instance, import from here everywhere
  /ngf.ts                   → (client sites only) getNgfContent(), getItems()
/prisma
  /schema.prisma            → Database schema — single source of truth
/types
  /index.ts                 → All TypeScript type definitions
/public                     → Static assets
```

For the NGF app specifically, see `NGF-Systems-app/CLAUDE.md` for the full route and architecture details.

---

## Absolute Rules — Never Break These

1. **TypeScript only.** Never write `.js` files. Every file is `.ts` or `.tsx`.
2. **One Prisma instance.** Always import `{ db }` from `@/lib/db`. Never create a new PrismaClient elsewhere.
3. **One Stripe instance.** Always import from `@/lib/stripe`. Never instantiate Stripe elsewhere.
4. **Auth through Clerk only.** Never write custom authentication logic.
5. **Never duplicate functions.** Before writing any new function, check if it already exists.
6. **Never install new libraries** without being explicitly asked. Flag it and ask first.
7. **Never delete or overwrite existing functions** when adding new features. Extend, don't replace.
8. **Always check existing components** before creating new ones.
9. **Environment variables only in `.env.local`.** Never hardcode keys or secrets.
10. **Database calls in API routes or server components only.** Never from client components.
11. **Every route group folder must have a layout.tsx file.**
12. **Never enable Turbopack.** Never use `--turbopack`.
13. **Client sites must never remove NgfEditBridge from layout.tsx.**
14. **Content field keys must match exactly** between `data-ngf-field` attributes, `lib/ngf.ts` usage, and the template schema in the NGF app.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `ClientCard.tsx` |
| Functions | camelCase | `getClientById()` |
| Files (non-component) | kebab-case | `client-helpers.ts` |
| Database tables | snake_case | `client_configs` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| API routes | kebab-case folders | `/api/portal/change-requests/route.ts` |
| Clerk roles | lowercase string | `"admin"`, `"client"` |

---

## Tailwind CSS — Required Setup

Every project must have these three files or Tailwind will not work:

**`tailwind.config.ts`:**
```typescript
import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
export default config
```

**`postcss.config.js`:**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**`app/globals.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`app/layout.tsx` must import `globals.css` at the top.

---

## Responsive Design Rules

- **Always mobile-first.** Write mobile layout first, scale up with `md:` and `lg:`
- **Every component must work at:** 375px (mobile), 768px (tablet), 1280px (desktop)
- Touch targets must be at least 44px tall on mobile
- Never use fixed pixel widths on containers — use `max-w-` with `w-full`
- Grids: default single column, expand on larger screens (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

---

## Component Rules

- Every component must have typed props using a TypeScript interface at the top of the file
- No `any` types — ever
- Keep components focused — if a component does more than one thing, split it
- Use `"use client"` only when strictly necessary (event handlers, hooks, browser APIs)
- Default to server components

---

## API Route Rules

- All API routes live in `/app/api/`
- Always validate all incoming request data before processing
- Always wrap handlers in try/catch
- Always return consistent JSON:

```typescript
// Success
return NextResponse.json({ success: true, data: result })
// Error
return NextResponse.json({ success: false, error: 'Descriptive message' }, { status: 400 })
```

Public routes include full CORS headers and an `OPTIONS` handler. No auth required.

---

## Security Rules

- Never expose secret keys or environment variables to the client side
- All protected routes must check Clerk auth before doing anything else
- Never trust client-sent data — always validate server-side
- Use Prisma parameterized queries only — never raw SQL string concatenation
- Portal queries must always filter by the authenticated client's `client_id`

---

## Clerk Setup — Required Steps (New Projects)

### 1. Install Clerk v6 (not latest)
```bash
npm install @clerk/nextjs@6
```

### 2. Customize the Session Token
Go to **dashboard.clerk.com → Configure → Sessions → Customize session token**, add:
```json
{ "metadata": "{{user.public_metadata}}" }
```
Without this, `sessionClaims.metadata` is always `{}` and all role checks fail.

### 3. Set Clerk Paths in .env.local
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/portal/portal-dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/portal/portal-request
```

### 4. Set User Roles in Clerk Dashboard
After signup, set `publicMetadata` manually in the Clerk dashboard:
```json
{ "role": "admin" }
```
or
```json
{ "role": "client" }
```
Role changes only take effect after the user signs out and back in.

### 5. Layout Components Must NOT Do Their Own Auth Checks
Middleware handles all auth. Layouts just wrap content — never call `currentUser()` or redirect from a layout.

---

## Vercel Deployment — Required Settings

- **Framework Preset:** Must be set to **Next.js** in Vercel project settings
- **Root Directory:** If the Next.js app is in a subdirectory (e.g. `site/`), set this in Vercel → Settings → General
- **Environment Variables:** All `.env.local` vars must be added in Vercel → Settings → Environment Variables before deploying

---

## next.config — Rules

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
```

- Never add turbo configuration
- Never add `experimental.serverActions.allowedOrigins` (Codespaces-only, not needed in production)
- Client sites must add CSP `frame-ancestors` headers — see Client Site Architecture above

---

## tsconfig.json — Required Path Alias

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}
```

Without `baseUrl` and `paths`, route group pages silently return 404.

---

## Common Commands

```bash
npm run dev
npm run build
npm run lint

# Database — always use local binary, never npx
./node_modules/.bin/prisma migrate dev --name <desc>
./node_modules/.bin/prisma generate
./node_modules/.bin/prisma studio
```

---

## What To Never Do

- Do not use `npx prisma` — always `./node_modules/.bin/prisma`
- Do not use `@clerk/nextjs@latest` — always pin to v6
- Do not install Next.js 16+, React 19+, or Prisma 6+
- Do not enable Turbopack under any circumstances
- Do not add auth checks in layout components — middleware handles all auth
- Do not call Prisma from client components
- Do not name portal routes the same as admin routes — prefix portal routes with `portal-`
- Do not forget `baseUrl` and `paths` in `tsconfig.json`
- Do not expect a role change to take effect while a user is still signed in
- Do not write inline styles — Tailwind only
- Do not hardcode content in client sites — always read from `getNgfContent()` with fallbacks
- Do not remove NgfEditBridge from a client site's layout
- Do not add `--turbopack` to any npm script
- Do not deploy without setting the Vercel Framework Preset to Next.js
- Do not host client websites through the NGF app — every client site is a separate Vercel project

---

*This file is the single source of truth for all NGFsystems development standards.*
