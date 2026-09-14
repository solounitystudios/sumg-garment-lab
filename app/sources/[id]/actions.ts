"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AnalysisStatus } from "@/types/domain";
import {
  assertNoFabricatedManualConfidence,
  validateNormalizedRegion,
  isCandidateRegionType,
} from "@/lib/domain/region-validation";
import { deriveStatusAfterRegionSetChanged, confirmReview } from "@/lib/domain/analysis-state";
import { validateExtractionRequest } from "@/lib/domain/extraction";

async function requireUserClient() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    redirect("/login");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return { supabase, user };
}

function errorRedirect(sourceId: string, message: string): never {
  redirect(`/sources/${sourceId}?error=${encodeURIComponent(message)}`);
}

async function recomputeAnalysisStatus(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  analysisId: string,
  currentStatus: AnalysisStatus,
) {
  if (!supabase) return;
  const { count } = await supabase
    .from("candidate_regions")
    .select("id", { count: "exact", head: true })
    .eq("analysis_id", analysisId);

  const nextStatus = deriveStatusAfterRegionSetChanged(currentStatus, count ?? 0);
  if (nextStatus !== currentStatus) {
    await supabase.from("creative_analyses").update({ status: nextStatus }).eq("id", analysisId);
  }
}

export async function createCandidateRegionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUserClient();

  const sourceId = String(formData.get("sourceId") ?? "");
  const analysisId = String(formData.get("analysisId") ?? "");
  const regionType = String(formData.get("regionType") ?? "");
  const label = String(formData.get("label") ?? "").trim() || null;
  const x = Number(formData.get("x"));
  const y = Number(formData.get("y"));
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));

  const { data: analysis } = await supabase
    .from("creative_analyses")
    .select("id, status, source_id")
    .eq("id", analysisId)
    .eq("owner_id", user.id)
    .eq("source_id", sourceId)
    .maybeSingle();

  if (!analysis) {
    errorRedirect(sourceId, "Analysis not found.");
  }

  const regionValidation = validateNormalizedRegion({ regionType, x, y, width, height, label });
  if (!regionValidation.ok) {
    errorRedirect(sourceId, regionValidation.message);
  }

  const confidenceGuard = assertNoFabricatedManualConfidence({
    createdBy: "manual",
    confidence: null,
  });
  if (!confidenceGuard.ok) {
    errorRedirect(sourceId, confidenceGuard.message);
  }

  const { error: insertError } = await supabase.from("candidate_regions").insert({
    analysis_id: analysisId,
    source_id: sourceId,
    owner_id: user.id,
    region_type: regionType,
    x,
    y,
    width,
    height,
    label,
  });

  if (insertError) {
    errorRedirect(sourceId, `Could not save region: ${insertError.message}`);
  }

  await recomputeAnalysisStatus(supabase, analysisId, analysis.status as AnalysisStatus);
  revalidatePath(`/sources/${sourceId}`);
}

export async function updateCandidateRegionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUserClient();

  const sourceId = String(formData.get("sourceId") ?? "");
  const analysisId = String(formData.get("analysisId") ?? "");
  const regionId = String(formData.get("regionId") ?? "");
  const regionType = String(formData.get("regionType") ?? "");
  const label = String(formData.get("label") ?? "").trim() || null;

  const { data: region } = await supabase
    .from("candidate_regions")
    .select("id")
    .eq("id", regionId)
    .eq("owner_id", user.id)
    .eq("source_id", sourceId)
    .maybeSingle();

  if (!region) {
    errorRedirect(sourceId, "Region not found.");
  }

  if (!isCandidateRegionType(regionType)) {
    errorRedirect(sourceId, `"${regionType}" is not a known candidate region type.`);
  }

  const { error: updateError } = await supabase
    .from("candidate_regions")
    .update({ region_type: regionType, label })
    .eq("id", regionId);

  if (updateError) {
    errorRedirect(sourceId, `Could not update region: ${updateError.message}`);
  }

  const { data: analysis } = await supabase
    .from("creative_analyses")
    .select("status")
    .eq("id", analysisId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (analysis) {
    await recomputeAnalysisStatus(supabase, analysisId, analysis.status as AnalysisStatus);
  }
  revalidatePath(`/sources/${sourceId}`);
}

export async function deleteCandidateRegionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUserClient();

  const sourceId = String(formData.get("sourceId") ?? "");
  const analysisId = String(formData.get("analysisId") ?? "");
  const regionId = String(formData.get("regionId") ?? "");

  const { data: analysis } = await supabase
    .from("creative_analyses")
    .select("status")
    .eq("id", analysisId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!analysis) {
    errorRedirect(sourceId, "Analysis not found.");
  }

  const { error: deleteError } = await supabase
    .from("candidate_regions")
    .delete()
    .eq("id", regionId)
    .eq("owner_id", user.id);

  if (deleteError) {
    errorRedirect(sourceId, `Could not remove region: ${deleteError.message}`);
  }

  await recomputeAnalysisStatus(supabase, analysisId, analysis.status as AnalysisStatus);
  revalidatePath(`/sources/${sourceId}`);
}

export async function confirmReviewAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUserClient();

  const sourceId = String(formData.get("sourceId") ?? "");
  const analysisId = String(formData.get("analysisId") ?? "");

  const { data: analysis } = await supabase
    .from("creative_analyses")
    .select("id, status")
    .eq("id", analysisId)
    .eq("owner_id", user.id)
    .eq("source_id", sourceId)
    .maybeSingle();

  if (!analysis) {
    errorRedirect(sourceId, "Analysis not found.");
  }

  const { count } = await supabase
    .from("candidate_regions")
    .select("id", { count: "exact", head: true })
    .eq("analysis_id", analysisId);

  const result = confirmReview(analysis.status as AnalysisStatus, count ?? 0);
  if (!result.ok) {
    errorRedirect(sourceId, result.reason);
  }

  const { error: updateError } = await supabase
    .from("creative_analyses")
    .update({ status: result.status })
    .eq("id", analysisId);

  if (updateError) {
    errorRedirect(sourceId, `Could not confirm review: ${updateError.message}`);
  }

  revalidatePath(`/sources/${sourceId}`);
}

export async function createExtractionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUserClient();

  const sourceId = String(formData.get("sourceId") ?? "");
  const candidateRegionId = String(formData.get("candidateRegionId") ?? "");

  const { data: analysis } = await supabase
    .from("creative_analyses")
    .select("status")
    .eq("source_id", sourceId)
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: region } = await supabase
    .from("candidate_regions")
    .select("source_id")
    .eq("id", candidateRegionId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!analysis || !region) {
    errorRedirect(sourceId, "Analysis or region not found.");
  }

  const validation = validateExtractionRequest({
    sourceId,
    candidateRegionId,
    regionSourceId: region.source_id,
    analysisStatus: analysis.status as AnalysisStatus,
  });

  if (!validation.ok) {
    errorRedirect(sourceId, validation.message);
  }

  const { error: insertError } = await supabase.from("extractions").insert({
    source_id: sourceId,
    candidate_region_id: candidateRegionId,
    owner_id: user.id,
  });

  if (insertError) {
    errorRedirect(sourceId, `Could not create extraction: ${insertError.message}`);
  }

  revalidatePath(`/sources/${sourceId}`);
}
