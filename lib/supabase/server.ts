import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Request-scoped, cookie-bound Supabase client for Server Components,
 * Server Actions, and Route Handlers. Runs as the signed-in user (not an
 * elevated role), so every query is subject to Postgres RLS — this is the
 * client almost all server-side data access should use.
 *
 * Returns `null` when Supabase has not been configured yet.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient<Database> | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component that can't set cookies directly.
          // Safe to ignore: middleware.ts refreshes the session cookie on
          // every request.
        }
      },
    },
  });
}
