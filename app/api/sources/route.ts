import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validateSourceUpload } from "@/lib/domain/upload-validation";
import { buildSourceStoragePath } from "@/lib/domain/storage-path";

const SOURCE_BUCKET = "garment-sources";

function jsonError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return jsonError(503, "Supabase is not configured.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(401, "Sign in required.");
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError(400, "No file provided.");
  }

  const validation = validateSourceUpload({
    mimeType: file.type,
    byteSize: file.size,
  });
  if (!validation.ok) {
    return jsonError(400, validation.message);
  }

  const widthField = formData.get("widthPx");
  const heightField = formData.get("heightPx");
  const widthPx =
    typeof widthField === "string" && Number.isFinite(Number(widthField))
      ? Math.round(Number(widthField))
      : null;
  const heightPx =
    typeof heightField === "string" && Number.isFinite(Number(heightField))
      ? Math.round(Number(heightField))
      : null;

  const storagePath = buildSourceStoragePath({
    ownerId: user.id,
    uniqueId: randomUUID(),
    originalFilename: file.name || "upload",
  });

  const { error: uploadError } = await supabase.storage
    .from(SOURCE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return jsonError(502, `Upload failed: ${uploadError.message}`);
  }

  const { data: source, error: insertError } = await supabase
    .from("garment_sources")
    .insert({
      owner_id: user.id,
      original_filename: file.name || "upload",
      mime_type: file.type,
      storage_bucket: SOURCE_BUCKET,
      storage_path: storagePath,
      byte_size: file.size,
      width_px: widthPx,
      height_px: heightPx,
    })
    .select("id")
    .single();

  if (insertError || !source) {
    // The storage object is now orphaned (no DB row references it). User
    // role has no delete permission on this bucket by design (Truth Rule
    // 5/6: originals are immutable, never overwritten or removed) — see
    // the "known limitations" note in the PR description.
    return jsonError(500, `Could not save source record: ${insertError?.message ?? "unknown error"}`);
  }

  const { error: analysisError } = await supabase.from("creative_analyses").insert({
    source_id: source.id,
    owner_id: user.id,
  });

  if (analysisError) {
    return jsonError(
      500,
      `Source saved but analysis record could not be created: ${analysisError.message}`,
    );
  }

  return NextResponse.json({ id: source.id }, { status: 201 });
}
