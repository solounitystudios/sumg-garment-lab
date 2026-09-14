import { describe, expect, it } from "vitest";
import { AnalysisStatus } from "@/types/domain";
import { ProviderAvailability } from "@/lib/creative/types";
import {
  confirmReview,
  canCreateExtraction,
  deriveStatusAfterRegionSetChanged,
  getAutomatedAnalysisAvailability,
  isManualFlowStatus,
} from "./analysis-state";

describe("deriveStatusAfterRegionSetChanged", () => {
  it("moves NOT_ANALYZED to NEEDS_REVIEW once a region exists", () => {
    expect(deriveStatusAfterRegionSetChanged(AnalysisStatus.NOT_ANALYZED, 1)).toBe(
      AnalysisStatus.NEEDS_REVIEW,
    );
  });

  it("drops back to NOT_ANALYZED when the last region is removed", () => {
    expect(deriveStatusAfterRegionSetChanged(AnalysisStatus.NEEDS_REVIEW, 0)).toBe(
      AnalysisStatus.NOT_ANALYZED,
    );
  });

  it("reopens a REVIEWED analysis to NEEDS_REVIEW when the region set changes", () => {
    expect(deriveStatusAfterRegionSetChanged(AnalysisStatus.REVIEWED, 2)).toBe(
      AnalysisStatus.NEEDS_REVIEW,
    );
  });

  it("never touches a non-manual-flow status like FAILED", () => {
    expect(deriveStatusAfterRegionSetChanged(AnalysisStatus.FAILED, 3)).toBe(
      AnalysisStatus.FAILED,
    );
  });
});

describe("isManualFlowStatus", () => {
  it("is true for NOT_ANALYZED, NEEDS_REVIEW, and REVIEWED", () => {
    expect(isManualFlowStatus(AnalysisStatus.NOT_ANALYZED)).toBe(true);
    expect(isManualFlowStatus(AnalysisStatus.NEEDS_REVIEW)).toBe(true);
    expect(isManualFlowStatus(AnalysisStatus.REVIEWED)).toBe(true);
  });

  it("is false for automated-provider-reserved statuses", () => {
    expect(isManualFlowStatus(AnalysisStatus.ANALYZING)).toBe(false);
    expect(isManualFlowStatus(AnalysisStatus.ANALYSIS_READY)).toBe(false);
    expect(isManualFlowStatus(AnalysisStatus.FAILED)).toBe(false);
    expect(isManualFlowStatus(AnalysisStatus.UNAVAILABLE)).toBe(false);
  });
});

describe("confirmReview", () => {
  it("confirms NEEDS_REVIEW with at least one region", () => {
    const result = confirmReview(AnalysisStatus.NEEDS_REVIEW, 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe(AnalysisStatus.REVIEWED);
  });

  it("refuses to confirm with zero regions", () => {
    const result = confirmReview(AnalysisStatus.NEEDS_REVIEW, 0);
    expect(result.ok).toBe(false);
  });

  it("refuses to confirm from NOT_ANALYZED", () => {
    const result = confirmReview(AnalysisStatus.NOT_ANALYZED, 1);
    expect(result.ok).toBe(false);
  });

  it("refuses to confirm from an already-REVIEWED status", () => {
    const result = confirmReview(AnalysisStatus.REVIEWED, 1);
    expect(result.ok).toBe(false);
  });
});

describe("canCreateExtraction", () => {
  it("is true only for REVIEWED", () => {
    expect(canCreateExtraction(AnalysisStatus.REVIEWED)).toBe(true);
    expect(canCreateExtraction(AnalysisStatus.NEEDS_REVIEW)).toBe(false);
    expect(canCreateExtraction(AnalysisStatus.NOT_ANALYZED)).toBe(false);
  });
});

describe("getAutomatedAnalysisAvailability", () => {
  it("always reports UNAVAILABLE in PR #2 — no automated provider exists", () => {
    const result = getAutomatedAnalysisAvailability();
    expect(result.availability).toBe(ProviderAvailability.UNAVAILABLE);
    expect(result.reason.length).toBeGreaterThan(0);
  });
});
