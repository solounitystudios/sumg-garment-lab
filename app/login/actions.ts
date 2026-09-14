"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeInternalRedirect } from "@/lib/domain/redirect";

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeInternalRedirect(formData.get("next"));

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    redirect(`/login?error=${encodeURIComponent("Supabase is not configured.")}`);
  }

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required.")}`);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next);
}
