# LifeAgent — Personal Operating System

Habits, sleep, training, money, notes, calendar and an AI coach in **one calm daily system**.

## Quick start

```bash
npm install
cp .env.example .env   # fill in Turso + JWT + Gmail values
npm run dev            # Vite frontend (proxies /api → localhost:3000)
npm run dev:api        # Vercel dev (API routes)
npm run build          # production build → dist/
npm run preview        # preview the production build
```

## What was hardened in this pass

- **Performance:** heavy panels (Analytics, Money, Body, Sleep, Calendar, Notes,
  Settings, Founder portal, Landing) are `React.lazy` code-split; vendor chunks
  (`react`, `recharts`, AI, utils) are split in `vite.config.js`. Initial bundle
  drops from one 1.1 MB chunk to several lazy chunks.
- **Dead import removed:** unused `@google/generative-ai` SDK import in `App.jsx`
  (AI calls go through `fetch`, so the SDK was pure bundle weight).
- **SEO:** canonical, description, Open Graph, Twitter cards, JSON-LD
  `WebApplication` schema, robots + sitemap.
- **PWA:** `manifest.webmanifest`, apple-touch icon, theme-color, skip-to-content
  link, `<noscript>` fallback.
- **Security:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` + immutable caching for `/assets/*` in `vercel.json`.
- **Reliability:** silent `catch(e){}` blocks in optimistic sync paths now log in
  dev; permanent note-delete failure surfaces a toast instead of failing silently.

## Env vars (see `.env.example`)

| Var | Used for |
|---|---|
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | libSQL database |
| `JWT_SECRET` | auth tokens |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | password-reset emails |

## Deploy

Vercel: `vercel --prod`. SPA rewrites + API routes are configured in `vercel.json`.
Android (Capacitor): `npx cap sync android`.
