import { CandidateRegionType } from "@/types/domain";

/**
 * Validation for a manually-drawn candidate region. Coordinates are
 * normalized (0-1), matching the storage schema and
 * `NormalizedBoundingBox` in lib/creative/types.ts, so validation is
 * independent of the source image's pixel resolution.
 */

const REGION_TYPE_VALUES = new Set<string>(Object.values(CandidateRegionType));

const EPSILON = 1e-6;

export type NormalizedRegionInput = {
  regionType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string | null;
};

export type RegionValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function isCandidateRegionType(
  value: string,
): value is CandidateRegionType {
  return REGION_TYPE_VALUES.has(value);
}

export function validateNormalizedRegion(
  input: NormalizedRegionInput,
): RegionValidationResult {
  if (!isCandidateRegionType(input.regionType)) {
    return {
      ok: false,
      code: "INVALID_REGION_TYPE",
      message: `"${input.regionType}" is not a known candidate region type.`,
    };
  }

  for (const [field, value] of [
    ["x", input.x],
    ["y", input.y],
    ["width", input.width],
    ["height", input.height],
  ] as const) {
    if (!Number.isFinite(value)) {
      return {
        ok: false,
        code: "INVALID_COORDINATE",
        message: `"${field}" must be a finite number.`,
      };
    }
  }

  if (input.x < 0 || input.x > 1 || input.y < 0 || input.y > 1) {
    return {
      ok: false,
      code: "OUT_OF_BOUNDS",
      message: "Region origin (x, y) must be within the normalized 0-1 image bounds.",
    };
  }

  if (input.width <= 0 || input.height <= 0) {
    return {
      ok: false,
      code: "NON_POSITIVE_SIZE",
      message: "Region width and height must be greater than zero.",
    };
  }

  if (input.x + input.width > 1 + EPSILON || input.y + input.height > 1 + EPSILON) {
    return {
      ok: false,
      code: "EXCEEDS_IMAGE_BOUNDS",
      message: "Region extends beyond the image bounds.",
    };
  }

  return { ok: true };
}

/**
 * Truth-rule guard: a manually-created region must never carry a fabricated
 * confidence value. Confidence is only meaningful for a future automated
 * provider's real detections.
 */
export function assertNoFabricatedManualConfidence(input: {
  createdBy: string;
  confidence: number | null | undefined;
}): RegionValidationResult {
  if (input.createdBy === "manual" && input.confidence != null) {
    return {
      ok: false,
      code: "FABRICATED_CONFIDENCE",
      message: "Manually-created regions must not have a confidence value.",
    };
  }
  return { ok: true };
}
