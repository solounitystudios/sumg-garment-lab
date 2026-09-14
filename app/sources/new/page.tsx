import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "../sources.module.css";
import SourceUploader from "./SourceUploader";

export default async function NewSourcePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/sources/new");
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Upload Source</h1>
      <p className={styles.subtitle}>JPEG, PNG, or WEBP, up to 20 MB.</p>
      <SourceUploader />
    </main>
  );
}
