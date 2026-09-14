import "server-only";
import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** The signed-in user for this request, or `null` if signed out / unconfigured. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return null;
  }
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
