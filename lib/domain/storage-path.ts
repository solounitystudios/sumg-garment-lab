/**
 * Storage path construction for the "garment-sources" bucket.
 *
 * Every object lives under "<ownerId>/...", which is what the bucket's
 * storage RLS policies key on (see
 * supabase/migrations/20260914000001_source_upload_creative_analysis_v1.sql).
 * Paths always include a fresh random id, so a new upload can never collide
 * with — and therefore never overwrite — an existing object.
 */

function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim().slice(-120);
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe.length > 0 ? safe : "upload";
}

export function buildSourceStoragePath(input: {
  ownerId: string;
  uniqueId: string;
  originalFilename: string;
}): string {
  const filename = sanitizeFilename(input.originalFilename);
  return `${input.ownerId}/sources/${input.uniqueId}-${filename}`;
}
