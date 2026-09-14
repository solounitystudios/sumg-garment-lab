/**
 * Validation rules for uploading an original garment source image.
 * Pure and framework-free so it can run identically on the client (to show
 * an error before upload) and on the server (the only place it is trusted).
 */

export const ALLOWED_SOURCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedSourceMimeType = (typeof ALLOWED_SOURCE_MIME_TYPES)[number];

/** 20 MiB. A garment reference photo has no legitimate reason to exceed this. */
export const MAX_SOURCE_UPLOAD_BYTES = 20 * 1024 * 1024;

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; code: "UNSUPPORTED_MIME_TYPE" | "FILE_TOO_LARGE" | "EMPTY_FILE"; message: string };

export function isAllowedSourceMimeType(
  mimeType: string,
): mimeType is AllowedSourceMimeType {
  return (ALLOWED_SOURCE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function validateSourceUpload(input: {
  mimeType: string;
  byteSize: number;
}): UploadValidationResult {
  if (!isAllowedSourceMimeType(input.mimeType)) {
    return {
      ok: false,
      code: "UNSUPPORTED_MIME_TYPE",
      message: `Unsupported file type "${input.mimeType}". Supported types: ${ALLOWED_SOURCE_MIME_TYPES.join(", ")}.`,
    };
  }
  if (input.byteSize <= 0) {
    return { ok: false, code: "EMPTY_FILE", message: "File is empty." };
  }
  if (input.byteSize > MAX_SOURCE_UPLOAD_BYTES) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: `File is ${(input.byteSize / (1024 * 1024)).toFixed(1)} MB, which exceeds the ${MAX_SOURCE_UPLOAD_BYTES / (1024 * 1024)} MB limit.`,
    };
  }
  return { ok: true };
}
