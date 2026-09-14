import { describe, expect, it } from "vitest";
import { AnalysisStatus } from "@/types/domain";
import { validateExtractionRequest } from "./extraction";

const base = {
  sourceId: "source-1",
  candidateRegionId: "region-1",
  regionSourceId: "source-1",
  analysisStatus: AnalysisStatus.REVIEWED,
};

describe("validateExtractionRequest", () => {
  it("accepts a reviewed region belonging to the given source", () => {
    expect(validateExtractionRequest(base).ok).toBe(true);
  });

  it("rejects a missing source or region id", () => {
    const result = validateExtractionRequest({ ...base, sourceId: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("MISSING_REFERENCE");
  });

  it("rejects an extraction whose region belongs to a different source", () => {
    const result = validateExtractionRequest({ ...base, regionSourceId: "some-other-source" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("SOURCE_MISMATCH");
  });

  it("rejects creating an extraction before the analysis is REVIEWED", () => {
    const result = validateExtractionRequest({
      ...base,
      analysisStatus: AnalysisStatus.NEEDS_REVIEW,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("ANALYSIS_NOT_REVIEWED");
  });

  it("rejects creating an extraction when analysis has not started", () => {
    const result = validateExtractionRequest({
      ...base,
      analysisStatus: AnalysisStatus.NOT_ANALYZED,
    });
    expect(result.ok).toBe(false);
  });
});
