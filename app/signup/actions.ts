"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    redirect(`/signup?error=${encodeURIComponent("Supabase is not configured.")}`);
  }

  if (!email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Email and password are required.")}`);
  }
  if (password.length < 8) {
    redirect(
      `/signup?error=${encodeURIComponent("Password must be at least 8 characters.")}`,
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: siteUrl ? { emailRedirectTo: `${siteUrl}/auth/confirm` } : undefined,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/signup?checkEmail=1");
}
