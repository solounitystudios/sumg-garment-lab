import Link from "next/link";
import styles from "@/app/forms.module.css";
import { signUpAction } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
}) {
  const { error, checkEmail } = await searchParams;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>SUMG Garment Lab</p>
        <h1 className={styles.title}>Create Account</h1>

        {error && <div className={styles.error}>{error}</div>}
        {checkEmail && (
          <div className={styles.notice}>
            Account created. Check your email for a confirmation link before
            signing in.
          </div>
        )}

        {!checkEmail && (
          <form action={signUpAction}>
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
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <button className={styles.submit} type="submit">
              Create Account
            </button>
          </form>
        )}

        <p className={styles.altAction}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
