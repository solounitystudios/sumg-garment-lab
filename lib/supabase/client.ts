import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Browser-safe Supabase client using the public anon key, with the
 * session synced to cookies so the server can read it too.
 *
 * Returns `null` when Supabase has not been configured (no project
 * provisioned yet) so callers can degrade truthfully instead of the app
 * crashing or pretending a backend is connected.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
