# SUMG Garment Lab — Product Architecture

This is the canonical architecture document for SUMG Garment Lab. It
defines the product's purpose, lifecycle, golden path, non-negotiable
truth rules, artwork version lineage, and creative provider architecture.
Later PRs implement against this document; if implementation and this
document diverge, update this document in the same PR.

## Product Purpose

SUMG Garment Lab is a garment-development and production operating
system. It takes a garment from a reference photo or design intent
through creative preparation, technical specification, and manufacturer
handoff — with a persistent, auditable record at every step.

## Full Lifecycle

```
Collection
  → Style
  → Garment
  → Source
  → Creative Analysis
  → Extraction
  → Artwork / Element
  → Materials / BOM
  → Size Specs
  → Sample
  → Preflight
  → Tech Pack
  → Manufacturer Package
  → Production
  → Commerce
  → Launch
```

## Golden Path

The primary end-to-end flow the product exists to support:

```
Reference Photo
  → Analyze Source
  → Detect Candidate Graphics / Logos / Text
  → Human Review
  → Extraction
  → Creative Lab
  → Adobe-assisted cleanup / reconstruction / vectorization (where available)
  → Human Approval
  → Approved Production Master
  → Garment Placement
  → Materials / BOM
  → Size Specs
  → Sample
  → Preflight
  → Tech Pack
  → Manufacturer Package
```

The project is not considered **activated** until one real or test
garment has completed this path end to end, including every production
data step — see `docs/ROADMAP.md` for the activation milestone.

## Truth Rules

These rules are non-negotiable and apply to every PR, feature, and UI
surface:

1. No fake production data.
2. No fake AI analysis.
3. No fake Adobe success.
4. No dead buttons presented as active.
5. Original source assets must remain immutable.
6. Every artwork transformation creates a new version — never overwrite.
7. Human approval is mandatory before production use.
8. Production readiness must come from persisted evidence, not inferred
   or assumed state.
9. Garment Lab orchestrates creative tools; it does not attempt to
   recreate all of Photoshop.
10. Garment Lab remains separate from SUMG Records for now, but keeps a
    clean, explicit integration boundary for future connection.

Any feature that cannot yet honor these rules (e.g. no Adobe credentials
configured, no Supabase project provisioned) must say so explicitly in
the UI and API responses, rather than silently degrading or simulating
success.

## Version Lineage

Artwork versions form a strict, append-only lineage. Every version
records its parent, so the full history from original source to approved
master is always reconstructable:

```
Original Source
  → Extraction
  → Background Removed
  → Cleaned
  → Reconstructed
  → Vectorized
  → Manual Revision
  → Approved Master
```

Every version must preserve:

- `parent` — the version it was derived from (null only for the original
  source)
- `operation` — one of `ArtworkVersionOperation` (`types/domain.ts`)
- `provider` — which `CreativeProcessingProvider` performed the operation
  (or "manual" for a human-produced revision)
- `prompt` / `instruction` — the input given to the provider, if any
- `file identity` — a stable reference to the stored asset
- `technical metadata` — dimensions, color space, format, etc., as
  actually returned by the operation
- `review status` — one of `ArtworkReviewStatus` (`types/domain.ts`)
- `timestamp`

Original source assets are immutable: no operation ever writes back to
the source version. Every transformation, whether automated or manual,
produces a new version row pointing at its parent.

## Creative Processing Provider Architecture

Automated and assisted image work is abstracted behind a single
provider-independent contract, `CreativeProcessingProvider`
(`lib/creative/types.ts`), with capabilities:

- `analyzeImage`
- `selectRegion`
- `cropObject`
- `removeBackground`
- `cleanupArtwork`
- `reconstructArtwork`
- `vectorizeArtwork`
- `inspectArtwork`
- `exportAsset`

Providers implemented or planned:

- `ManualCreativeProvider` — implemented in this PR. Performs no
  automation; every capability call returns an explicit `UNSUPPORTED`
  result. Represents "a human does this outside Garment Lab and uploads
  the result" as a first-class, always-available path.
- `AdobeCreativeProvider` — future. Backs supported capabilities with
  real Adobe APIs (Photoshop/Firefly services, Illustrator-compatible
  export). See `docs/ROADMAP.md` PR 5.
- `ChatGPTImageProvider` — future, possible.
- `OCRProvider` — future, possible.

Domain and UI code depend only on `CreativeProcessingProvider`,
`CreativeCapability`, `CreativeOperationResult`, and related types in
`lib/creative/types.ts`. **No domain logic may depend on Adobe-specific
request/response shapes.** A provider that cannot perform an operation
must return `UNSUPPORTED` or `UNAVAILABLE` with a truthful reason —
never a simulated `COMPLETED` result.

## Standalone Boundary with SUMG Records

Garment Lab does not integrate with SUMG Records in this phase. Any
future integration point (e.g. pushing an approved manufacturer package
or product data into Records) must be introduced as an explicit,
isolated boundary — not by importing Records code or schema directly
into Garment Lab.
