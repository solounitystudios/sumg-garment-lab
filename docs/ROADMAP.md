# SUMG Garment Lab — Development Roadmap

See `docs/PRODUCT_ARCHITECTURE.md` for the full product architecture,
lifecycle, and truth rules this roadmap implements against.

## PR Sequence

**PR 1 — Foundation + architecture** *(this PR)*
Next.js/TypeScript app scaffold, minimal visual shell, project structure,
Supabase client wiring (no schema), `CreativeProcessingProvider` contract
with `ManualCreativeProvider`, core domain types, architecture docs, CI.

**PR 2 — Source upload + asset model + Creative Analysis V1**
Persisted source assets, storage wiring, Creative Analysis states and
candidate region review UI. No fabricated detections — analysis that
cannot run yet must report `UNAVAILABLE`, not fake results.

**PR 3 — Extraction + artwork version lineage**
Persisted `ArtworkVersion` records with full lineage (parent, operation,
provider, technical metadata, review status). Extraction as the first
real transformation off of a source.

**PR 4 — Creative Lab + manual processing workflow**
The focused Creative Lab UI (sources/versions left, canvas center,
analysis/actions right, version timeline bottom) driven entirely by the
manual workflow: upload, crop, manual revision upload, approve/reject.

**PR 5 — Adobe provider integration**
`AdobeCreativeProvider` implementing supported capabilities against real
Adobe APIs. Truthful availability reporting when credentials are absent;
manual workflow remains fully operational regardless.

**PR 6 — Garment / placements / BOM / size specs**
Collection, Style, Garment, Placement (with real physical dimensions and
`PrintMethod`), Materials/BOM, and Size Specs data model and UI.

**PR 7 — Samples + preflight**
Sample revisions and deterministic production preflight checks derived
from persisted evidence.

**PR 8 — Tech Pack + manufacturer package**
PDF Tech Pack generation and manufacturer package export.

PRs are kept small and focused. None of them merge automatically —
merging requires explicit authorization.

## Activation Milestone

The project is not considered **activated** until one real or test
garment completes the full path:

```
Create Collection
  → Create Style
  → Upload Source
  → Analyze
  → Extract Graphic
  → Produce Prepared Artwork
  → Human Approve
  → Place on Garment
  → Add Materials/BOM
  → Add Size Specs
  → Create Sample Revision
  → Approve Sample
  → Run Preflight
  → Generate Tech Pack
  → Generate Manufacturer Package
```

This milestone is expected to land once PR 6–8 are complete and wired
together end to end.
