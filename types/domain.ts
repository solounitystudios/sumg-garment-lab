/**
 * Core, implementation-neutral domain types for SUMG Garment Lab.
 *
 * These anchor the product architecture described in
 * docs/PRODUCT_ARCHITECTURE.md. They intentionally carry no persistence,
 * UI, or provider-specific concerns.
 */

/** Lifecycle status of Creative Analysis for a given source asset. */
export enum AnalysisStatus {
  NOT_ANALYZED = "NOT_ANALYZED",
  ANALYZING = "ANALYZING",
  ANALYSIS_READY = "ANALYSIS_READY",
  NEEDS_REVIEW = "NEEDS_REVIEW",
  REVIEWED = "REVIEWED",
  FAILED = "FAILED",
  UNAVAILABLE = "UNAVAILABLE",
}

/** Category of a detected or human-marked region of interest on a source. */
export enum CandidateRegionType {
  CHEST_GRAPHIC = "CHEST_GRAPHIC",
  BACK_GRAPHIC = "BACK_GRAPHIC",
  SLEEVE_GRAPHIC = "SLEEVE_GRAPHIC",
  LOGO = "LOGO",
  TEXT = "TEXT",
  ILLUSTRATION = "ILLUSTRATION",
  PATCH = "PATCH",
  EMBROIDERY = "EMBROIDERY",
  PATTERN = "PATTERN",
  GARMENT = "GARMENT",
  UNKNOWN = "UNKNOWN",
}

/**
 * The operation that produced a given artwork version. Forms the version
 * lineage described in docs/PRODUCT_ARCHITECTURE.md — every transformation
 * creates a new version rather than overwriting a prior one.
 */
export enum ArtworkVersionOperation {
  SOURCE = "SOURCE",
  EXTRACTION = "EXTRACTION",
  BACKGROUND_REMOVED = "BACKGROUND_REMOVED",
  CLEANED = "CLEANED",
  RECONSTRUCTED = "RECONSTRUCTED",
  VECTORIZED = "VECTORIZED",
  MANUAL_REVISION = "MANUAL_REVISION",
  APPROVED_MASTER = "APPROVED_MASTER",
}

/** Human review status of an artwork version. */
export enum ArtworkReviewStatus {
  DRAFT = "DRAFT",
  NEEDS_REVIEW = "NEEDS_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

/** Physical print/decoration method for an artwork placement on a garment. */
export enum PrintMethod {
  SCREEN_PRINT = "SCREEN_PRINT",
  DTG = "DTG",
  DTF = "DTF",
  EMBROIDERY = "EMBROIDERY",
  HEAT_TRANSFER = "HEAT_TRANSFER",
  SUBLIMATION = "SUBLIMATION",
  APPLIQUE = "APPLIQUE",
  PATCH = "PATCH",
  OTHER = "OTHER",
}
