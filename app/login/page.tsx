import Link from "next/link";
import styles from "@/app/forms.module.css";
import { signInAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>SUMG Garment Lab</p>
        <h1 className={styles.title}>Sign In</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form action={signInAction}>
          <input type="hidden" name="next" value={next ?? "/sources"} />
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className={styles.submit} type="submit">
            Sign In
          </button>
        </form>

        <p className={styles.altAction}>
          No account? <Link href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  );
}
