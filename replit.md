# Ravyu — Business Reputation CRM

A full-stack Google Business review CRM SaaS. Import Google Maps reviews, reply with AI, generate social posts, run review-request campaigns, manage a public business landing page, and track analytics.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/ravyu run dev` — run the frontend (port 20620)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — MySQL connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + wouter + TanStack Query + shadcn/ui
- API: Express 5
- DB: MySQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- Charts: Recharts
- Toasts: Sonner
- Build: esbuild (CJS bundle for server)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth API contract (40+ endpoints)
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas
- `lib/db/src/schema/` — Drizzle ORM schema files (users, reviews, business_profiles, etc.)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/api-server/src/lib/auth.ts` — JWT helpers + requireAuth middleware
- `artifacts/ravyu/src/pages/` — all 17 frontend pages
- `artifacts/ravyu/src/components/auth/auth-provider.tsx` — JWT auth context
- `artifacts/ravyu/src/components/layout/app-layout.tsx` — sidebar + header shell

## Architecture decisions

- JWT access tokens (15min) + refresh tokens (30d) stored in localStorage; custom fetch layer injects Bearer header automatically.
- All API routes follow contract-first design: OpenAPI spec → Orval codegen → typed hooks + Zod schemas used for both server validation and client consumption.
- AI endpoints have demo fallback when `OPENAI_API_KEY` is not set.
- Scraping has demo mode when `APIFY_TOKEN` is not set (imports sample reviews).
- Email sending is demo mode when `SMTP_HOST` is not set (marks sent, no actual email).
- Public routes (`/api/public/*`) require no auth — used for business landing pages and review collection links.

## Product

- **Reviews**: Import from Google Maps (scrape), filter/search, AI reply generation, AI social post generation
- **AI Generator**: Custom content prompts or review-to-post conversion for Instagram, Facebook, Twitter, LinkedIn, Google Business
- **Business Profile**: Full profile editor with branding colors, social links, hours — generates a public `/b/:slug` landing page
- **Review Requests**: Add customers individually or bulk CSV import, copy unique links, send emails, track status (pending → sent → opened → completed)
- **Reports**: Rating distribution, sentiment breakdown, top reviewers
- **Analytics**: Page views, review clicks, conversion rate for public landing page
- **Public Pages**: `/b/:slug` — branded business page; `/review/:slug` — generic collection; `/review/:slug/:token` — personalized tracked link

## User preferences

- Theme: deep navy/indigo sidebar (`--sidebar: 227 45% 18%`), amber/gold accent (`--accent: 40 93% 50%`), light background in light mode
- Data-testid attributes on all interactive elements for testability

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`
- Run `pnpm --filter @workspace/db run push` after changing Drizzle schema files
- The `@workspace/api-client-react` package exports `setAuthTokenGetter` from its main index — do NOT use deep imports like `/src/custom-fetch`
- Do NOT run `pnpm dev` at workspace root — use workflow restart or filter commands
- Verify artifacts with `pnpm --filter @workspace/<slug> run typecheck`, not `build`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI env vars to unlock full features: `OPENAI_API_KEY`, `APIFY_TOKEN`, `SMTP_HOST/PORT/USER/PASS/FROM`
