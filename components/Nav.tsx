import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "./Nav.module.css";

export default async function Nav() {
  const user = await getCurrentUser();

  return (
    <nav className={styles.bar}>
      <Link className={styles.brand} href="/">
        SUMG Garment Lab
      </Link>
      <div className={styles.links}>
        <Link className={styles.link} href="/">
          Home
        </Link>
        <Link className={styles.link} href="/sources">
          Sources
        </Link>
        {user ? (
          <>
            <span className={styles.email}>{user.email}</span>
            <form action="/auth/sign-out" method="post">
              <button className={styles.signOut} type="submit">
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <Link className={styles.link} href="/login">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
