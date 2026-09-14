import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Browser-safe Supabase client using the public anon key.
 *
 * Returns `null` when Supabase has not been configured (no project
 * provisioned yet) so callers can degrade truthfully instead of the app
 * crashing or pretending a backend is connected.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}
