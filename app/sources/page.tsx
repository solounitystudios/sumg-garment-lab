import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./sources.module.css";

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default async function SourcesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/sources");
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const { data: sources, error } = await supabase
    .from("garment_sources")
    .select("id, original_filename, mime_type, byte_size, width_px, height_px, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Sources</h1>
        <Link className={styles.newButton} href="/sources/new">
          Upload Source
        </Link>
      </div>

      {error && <div className={styles.empty}>Could not load sources: {error.message}</div>}

      {!error && (!sources || sources.length === 0) && (
        <div className={styles.empty}>
          No sources yet. Upload a reference photo to get started.
        </div>
      )}

      {!error && sources && sources.length > 0 && (
        <div className={styles.grid}>
          {sources.map((source) => (
            <Link key={source.id} className={styles.card} href={`/sources/${source.id}`}>
              <div className={styles.cardName}>{source.original_filename}</div>
              <div className={styles.cardMeta}>
                {source.mime_type} · {formatBytes(source.byte_size)}
                {source.width_px && source.height_px
                  ? ` · ${source.width_px}×${source.height_px}px`
                  : ""}
              </div>
              <span className={styles.badge}>
                {new Date(source.created_at).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
