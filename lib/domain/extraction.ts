import { AnalysisStatus } from "@/types/domain";
import { canCreateExtraction } from "./analysis-state";

/**
 * Validation for creating an extraction. An extraction is a persisted
 * intent — "this reviewed region should become an extraction" — not a
 * processed image. No crop/processing pipeline exists yet (PR #3+), so
 * every extraction created in PR #2 has status "PENDING" and a null
 * storage_path. See docs/PRODUCT_ARCHITECTURE.md truth rules.
 */

export type ExtractionRequest = {
  sourceId: string;
  candidateRegionId: string;
  /** The source_id actually recorded on the candidate region, per the DB. */
  regionSourceId: string;
  analysisStatus: AnalysisStatus;
};

export type ExtractionValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function validateExtractionRequest(
  input: ExtractionRequest,
): ExtractionValidationResult {
  if (!input.sourceId || !input.candidateRegionId) {
    return {
      ok: false,
      code: "MISSING_REFERENCE",
      message: "An extraction requires both a source and a candidate region.",
    };
  }

  if (input.regionSourceId !== input.sourceId) {
    return {
      ok: false,
      code: "SOURCE_MISMATCH",
      message: "The candidate region does not belong to the given source.",
    };
  }

  if (!canCreateExtraction(input.analysisStatus)) {
    return {
      ok: false,
      code: "ANALYSIS_NOT_REVIEWED",
      message:
        'The candidate region set must be confirmed as reviewed ("REVIEWED") before creating an extraction.',
    };
  }

  return { ok: true };
}

export const EXTRACTION_PENDING_COPY =
  "Extraction prepared — image processing not yet implemented.";
