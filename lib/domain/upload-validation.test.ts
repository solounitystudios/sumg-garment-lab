import { describe, expect, it } from "vitest";
import {
  MAX_SOURCE_UPLOAD_BYTES,
  isAllowedSourceMimeType,
  validateSourceUpload,
} from "./upload-validation";

describe("isAllowedSourceMimeType", () => {
  it("accepts jpeg, png, and webp", () => {
    expect(isAllowedSourceMimeType("image/jpeg")).toBe(true);
    expect(isAllowedSourceMimeType("image/png")).toBe(true);
    expect(isAllowedSourceMimeType("image/webp")).toBe(true);
  });

  it("rejects svg and pdf, since PR #2 does not implement them", () => {
    expect(isAllowedSourceMimeType("image/svg+xml")).toBe(false);
    expect(isAllowedSourceMimeType("application/pdf")).toBe(false);
  });
});

describe("validateSourceUpload", () => {
  it("accepts a valid jpeg under the size limit", () => {
    const result = validateSourceUpload({ mimeType: "image/jpeg", byteSize: 1024 });
    expect(result.ok).toBe(true);
  });

  it("rejects an unsupported mime type", () => {
    const result = validateSourceUpload({ mimeType: "application/pdf", byteSize: 1024 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("UNSUPPORTED_MIME_TYPE");
  });

  it("rejects an empty file", () => {
    const result = validateSourceUpload({ mimeType: "image/png", byteSize: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("EMPTY_FILE");
  });

  it("rejects a file over the byte limit", () => {
    const result = validateSourceUpload({
      mimeType: "image/png",
      byteSize: MAX_SOURCE_UPLOAD_BYTES + 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FILE_TOO_LARGE");
  });

  it("accepts a file exactly at the byte limit", () => {
    const result = validateSourceUpload({
      mimeType: "image/webp",
      byteSize: MAX_SOURCE_UPLOAD_BYTES,
    });
    expect(result.ok).toBe(true);
  });
});
