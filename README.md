# SUMG Garment Lab

Garment development and production operating system: it takes a garment
from reference photo through creative preparation, technical
specification, and manufacturer handoff, with a persistent, auditable
record at every step.

**Status: Source upload + manual Creative Analysis (PR #2).** Sign-up/
sign-in, real source upload to private storage, and a manual
region-marking workflow (mark candidate regions, review, create an
extraction intent) are implemented. Automated analysis, the Creative
Lab, Adobe integration, and production data (BOM, size specs, tech
packs, etc.) are not — see `docs/ROADMAP.md`.

- Product architecture, lifecycle, and truth rules:
  [`docs/PRODUCT_ARCHITECTURE.md`](docs/PRODUCT_ARCHITECTURE.md)
- PR sequence and activation milestone:
  [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Supabase](https://supabase.com) — a dedicated `sumg-garment-lab`
  project (Postgres + Auth + Storage), separate from every other SUMG
  product's database. Schema and RLS policies live in
  `supabase/migrations/`.
- Plain CSS (CSS Modules) — no UI framework added
- [Vitest](https://vitest.dev) for unit tests

## Truth Rules (summary)

No fake production data. No fake AI analysis. No fake Adobe success. No
dead buttons presented as active. Original source assets are immutable;
every artwork transformation creates a new version. Human approval is
mandatory before production use. Production readiness comes from
persisted evidence. Full detail in
[`docs/PRODUCT_ARCHITECTURE.md`](docs/PRODUCT_ARCHITECTURE.md).

## Local Development

Requires Node.js 20+ and npm.

```bash
npm install
npm run dev       # start the dev server at http://localhost:3000
npm run typecheck # next typegen && tsc --noEmit
npm run lint      # eslint
npm test          # vitest run
npm run build     # production build
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in values for the
`sumg-garment-lab` Supabase project:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

The app still runs with these unset — features that depend on Supabase
report themselves as unavailable rather than failing silently or
fabricating data. `NEXT_PUBLIC_SITE_URL` is only needed to build the
sign-up email-confirmation link; without it, sign-up still works but the
confirmation email's link may not resolve correctly.

Sign-up uses Supabase Auth's default email sender, which has a low
built-in rate limit. For anything beyond light manual testing, configure
a custom SMTP provider in the Supabase dashboard under Authentication →
Email settings.

## Database

Schema, RLS policies, and the storage bucket for the `sumg-garment-lab`
Supabase project are defined in `supabase/migrations/` as plain SQL and
applied via the Supabase CLI or MCP — there is no ORM. After a schema
change, regenerate `lib/supabase/database.types.ts` from the live
project rather than hand-editing it.
