import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.shell}>
      <p className={styles.eyebrow}>SUMG Garment Lab</p>
      <h1 className={styles.title}>Design · Develop · Produce</h1>
      <p className={styles.tagline}>Garment Development &amp; Production</p>
      <p className={styles.description}>
        Garment development and production operating system. This
        foundation lays the groundwork for source analysis, creative
        preparation, and production-ready tech packs.
      </p>
      <span className={styles.status}>Status: Foundation</span>
    </main>
  );
}
