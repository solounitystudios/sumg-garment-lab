# SUMG Garment Lab

Garment development and production operating system: it takes a garment
from reference photo through creative preparation, technical
specification, and manufacturer handoff, with a persistent, auditable
record at every step.

**Status: FOUNDATION.** This repository currently contains the app
scaffold, project structure, provider/domain contracts, and architecture
docs only. No feature workflows (source analysis, extraction, Creative
Lab, tech packs, etc.) are implemented yet — see `docs/ROADMAP.md`.

- Product architecture, lifecycle, and truth rules:
  [`docs/PRODUCT_ARCHITECTURE.md`](docs/PRODUCT_ARCHITECTURE.md)
- PR sequence and activation milestone:
  [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Supabase](https://supabase.com) — planned persistence/storage backend
  (client wiring only in this PR; no project provisioned, no schema yet)
- Plain CSS (CSS Modules) — no UI framework added

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
npm run typecheck # tsc --noEmit
npm run lint      # eslint
npm run build     # production build
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in values once a Supabase
project exists:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The app runs with these unset. Features that depend on Supabase must
report themselves as unavailable rather than failing silently or
fabricating data.
