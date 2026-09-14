import { describe, expect, it } from "vitest";
import {
  assertNoFabricatedManualConfidence,
  isCandidateRegionType,
  validateNormalizedRegion,
} from "./region-validation";

describe("isCandidateRegionType", () => {
  it("accepts every domain CandidateRegionType value", () => {
    expect(isCandidateRegionType("CHEST_GRAPHIC")).toBe(true);
    expect(isCandidateRegionType("LOGO")).toBe(true);
    expect(isCandidateRegionType("UNKNOWN")).toBe(true);
  });

  it("rejects a value that is not a known region type", () => {
    expect(isCandidateRegionType("SLEEVE")).toBe(false);
    expect(isCandidateRegionType("")).toBe(false);
  });
});

describe("validateNormalizedRegion", () => {
  const base = { regionType: "LOGO", x: 0.1, y: 0.1, width: 0.2, height: 0.2 };

  it("accepts a well-formed region within bounds", () => {
    expect(validateNormalizedRegion(base).ok).toBe(true);
  });

  it("rejects an unknown region type", () => {
    const result = validateNormalizedRegion({ ...base, regionType: "NOT_A_TYPE" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_REGION_TYPE");
  });

  it("rejects a non-finite coordinate", () => {
    const result = validateNormalizedRegion({ ...base, x: Number.NaN });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_COORDINATE");
  });

  it("rejects an origin outside the 0-1 bounds", () => {
    const result = validateNormalizedRegion({ ...base, x: 1.5 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("OUT_OF_BOUNDS");
  });

  it("rejects zero or negative width/height", () => {
    const result = validateNormalizedRegion({ ...base, width: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NON_POSITIVE_SIZE");
  });

  it("rejects a region that extends past the image bounds", () => {
    const result = validateNormalizedRegion({ ...base, x: 0.9, width: 0.5 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("EXCEEDS_IMAGE_BOUNDS");
  });

  it("accepts a region that exactly fills the image", () => {
    const result = validateNormalizedRegion({
      regionType: "GARMENT",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
    expect(result.ok).toBe(true);
  });
});

describe("assertNoFabricatedManualConfidence", () => {
  it("accepts a manual region with no confidence", () => {
    const result = assertNoFabricatedManualConfidence({ createdBy: "manual", confidence: null });
    expect(result.ok).toBe(true);
  });

  it("rejects a manual region that carries a confidence value", () => {
    const result = assertNoFabricatedManualConfidence({ createdBy: "manual", confidence: 0.87 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FABRICATED_CONFIDENCE");
  });

  it("allows confidence for a non-manual creator (future automated provider)", () => {
    const result = assertNoFabricatedManualConfidence({ createdBy: "adobe", confidence: 0.87 });
    expect(result.ok).toBe(true);
  });
});
