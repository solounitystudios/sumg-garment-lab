import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AnalysisStatus } from "@/types/domain";
import { canCreateExtraction, getAutomatedAnalysisAvailability } from "@/lib/domain/analysis-state";
import { EXTRACTION_PENDING_COPY } from "@/lib/domain/extraction";
import RegionMarker from "@/components/RegionMarker";
import RegionRow from "@/components/RegionRow";
import styles from "./detail.module.css";
import {
  confirmReviewAction,
  createCandidateRegionAction,
  createExtractionAction,
  deleteCandidateRegionAction,
  updateCandidateRegionAction,
} from "./actions";

const SIGNED_URL_TTL_SECONDS = 120;

export default async function SourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: bannerError } = await searchParams;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/sources/${id}`);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const { data: source } = await supabase
    .from("garment_sources")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!source) {
    notFound();
  }

  const { data: analysis } = await supabase
    .from("creative_analyses")
    .select("*")
    .eq("source_id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: regions } = await supabase
    .from("candidate_regions")
    .select("*")
    .eq("source_id", id)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const { data: extractions } = await supabase
    .from("extractions")
    .select("*")
    .eq("source_id", id)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: signedUrlData } = await supabase.storage
    .from(source.storage_bucket)
    .createSignedUrl(source.storage_path, SIGNED_URL_TTL_SECONDS);

  const analysisStatus = (analysis?.status ?? AnalysisStatus.NOT_ANALYZED) as AnalysisStatus;
  const automatedAnalysis = getAutomatedAnalysisAvailability();
  const regionList = regions ?? [];
  const extractionList = extractions ?? [];
  const extractableStatus = canCreateExtraction(analysisStatus);
  const extractedRegionIds = new Set(extractionList.map((extraction) => extraction.candidate_region_id));

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/sources">
        ← Sources
      </Link>
      <h1 className={styles.title}>{source.original_filename}</h1>
      <div className={styles.metaRow}>
        <span>{source.mime_type}</span>
        <span>{(source.byte_size / (1024 * 1024)).toFixed(2)} MB</span>
        {source.width_px && source.height_px && (
          <span>
            {source.width_px}×{source.height_px}px
          </span>
        )}
        <span>Uploaded {new Date(source.created_at).toLocaleString()}</span>
      </div>

      {bannerError && <div className={styles.errorBanner}>{bannerError}</div>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Automated Analysis</h2>
        <div className={styles.unavailablePanel}>
          <div className={styles.unavailableTitle}>Unavailable</div>
          <div className={styles.unavailableReason}>{automatedAnalysis.reason}</div>
        </div>
      </section>

      {signedUrlData?.signedUrl && analysis && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Mark Region Manually</h2>
          <div className={styles.statusRow}>
            <span className={styles.statusBadge}>{analysisStatus}</span>
            {analysisStatus === AnalysisStatus.NEEDS_REVIEW && (
              <form action={confirmReviewAction}>
                <input type="hidden" name="sourceId" value={source.id} />
                <input type="hidden" name="analysisId" value={analysis.id} />
                <button className={styles.confirmButton} type="submit">
                  Confirm Review
                </button>
              </form>
            )}
          </div>

          <RegionMarker
            sourceId={source.id}
            analysisId={analysis.id}
            imageUrl={signedUrlData.signedUrl}
            imageAlt={source.original_filename}
            regionCount={regionList.length}
            createRegionAction={createCandidateRegionAction}
          />
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Candidate Regions</h2>
        {regionList.length === 0 ? (
          <p className={styles.empty}>No regions marked yet.</p>
        ) : (
          <div className={styles.regionList}>
            {regionList.map((region) => (
              <div key={region.id}>
                <RegionRow
                  sourceId={source.id}
                  analysisId={analysis?.id ?? ""}
                  region={region}
                  updateRegionAction={updateCandidateRegionAction}
                  deleteRegionAction={deleteCandidateRegionAction}
                />
                {extractableStatus && !extractedRegionIds.has(region.id) && (
                  <form action={createExtractionAction} className={styles.extractFormSpacing}>
                    <input type="hidden" name="sourceId" value={source.id} />
                    <input type="hidden" name="candidateRegionId" value={region.id} />
                    <button className={styles.extractButton} type="submit">
                      Create Extraction
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
        {!extractableStatus && regionList.length > 0 && (
          <p className={styles.empty}>
            Confirm review to enable creating extractions from these regions.
          </p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Extractions</h2>
        {extractionList.length === 0 ? (
          <p className={styles.empty}>No extractions yet.</p>
        ) : (
          extractionList.map((extraction) => (
            <div key={extraction.id} className={styles.extractionCard}>
              <span className={styles.extractionMeta}>
                {extraction.status === "PENDING"
                  ? EXTRACTION_PENDING_COPY
                  : extraction.status}
              </span>
              <span className={styles.extractionMeta}>
                {new Date(extraction.created_at).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
