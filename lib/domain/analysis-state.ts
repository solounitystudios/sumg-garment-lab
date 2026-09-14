import { AnalysisStatus } from "@/types/domain";
import { ProviderAvailability } from "@/lib/creative/types";

/**
 * PR #2 Creative Analysis state machine (manual workflow only).
 *
 * `AnalysisStatus` (types/domain.ts) describes the review state of one
 * source's candidate-region set. It is deliberately NOT the same thing as
 * "is an automated provider available" — a source can be fully reviewed
 * through the manual workflow while automated analysis remains permanently
 * UNAVAILABLE. `getAutomatedAnalysisAvailability()` below is the separate,
 * system-wide signal for that, so the two are never conflated.
 *
 * PR #2 manual-only transitions:
 *
 *   NOT_ANALYZED --(region saved)--> NEEDS_REVIEW
 *   NEEDS_REVIEW --(region saved/edited/removed)--> NEEDS_REVIEW
 *   NEEDS_REVIEW --(review confirmed, >=1 region)--> REVIEWED
 *   REVIEWED --(region saved/edited/removed)--> NEEDS_REVIEW  (review goes stale)
 *   * --(all regions removed)--> NOT_ANALYZED
 *
 * ANALYZING, ANALYSIS_READY, FAILED are reserved for a real automated
 * provider (PR #5+) and are never produced by the manual workflow. This
 * module does not transition into or out of them.
 */

const MANUAL_FLOW_STATUSES = new Set<AnalysisStatus>([
  AnalysisStatus.NOT_ANALYZED,
  AnalysisStatus.NEEDS_REVIEW,
  AnalysisStatus.REVIEWED,
]);

/** Whether `status` is one this module's manual-flow transitions apply to. */
export function isManualFlowStatus(status: AnalysisStatus): boolean {
  return MANUAL_FLOW_STATUSES.has(status);
}

/**
 * Recompute status after the candidate-region set changes (a region was
 * added, edited, or removed). Only applies to manual-flow statuses; any
 * other status (reserved for a future automated provider) is returned
 * unchanged.
 */
export function deriveStatusAfterRegionSetChanged(
  current: AnalysisStatus,
  regionCount: number,
): AnalysisStatus {
  if (!isManualFlowStatus(current)) {
    return current;
  }
  return regionCount > 0 ? AnalysisStatus.NEEDS_REVIEW : AnalysisStatus.NOT_ANALYZED;
}

export type ConfirmReviewResult =
  | { ok: true; status: AnalysisStatus.REVIEWED }
  | { ok: false; reason: string };

/** Whether the region set can be confirmed as reviewed right now. */
export function confirmReview(
  current: AnalysisStatus,
  regionCount: number,
): ConfirmReviewResult {
  if (current !== AnalysisStatus.NEEDS_REVIEW) {
    return {
      ok: false,
      reason: `Cannot confirm review from status "${current}". Add a candidate region first.`,
    };
  }
  if (regionCount <= 0) {
    return {
      ok: false,
      reason: "Add at least one candidate region before confirming review.",
    };
  }
  return { ok: true, status: AnalysisStatus.REVIEWED };
}

/** Whether an extraction can be created from a region on this analysis. */
export function canCreateExtraction(analysisStatus: AnalysisStatus): boolean {
  return analysisStatus === AnalysisStatus.REVIEWED;
}

export type AutomatedAnalysisAvailability = {
  availability: ProviderAvailability;
  reason: string;
};

/**
 * System-wide automated-analysis availability. Always UNAVAILABLE in PR #2
 * — no automated provider is implemented yet (see docs/ROADMAP.md PR #5).
 * This is intentionally independent of any source's `AnalysisStatus`.
 */
export function getAutomatedAnalysisAvailability(): AutomatedAnalysisAvailability {
  return {
    availability: ProviderAvailability.UNAVAILABLE,
    reason: "No automated creative analysis provider is connected.",
  };
}
