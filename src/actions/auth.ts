"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().toLowerCase().email();

export type SignInResult =
  | { ok: true }
  | { ok: false; message: string };

export async function sendMagicLink(formData: FormData): Promise<SignInResult> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false, message: "Vul een geldig e-mailadres in." };
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      // Allow first-time signup so the operator can bootstrap their
      // own admin account without needing Supabase Studio access.
      // The /auth/callback route auto-claims the unlinked staff row,
      // so granting RLS access still requires being the very first
      // logged-in user (or having an existing staff link).
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("[auth] signInWithOtp:", error);
    return { ok: false, message: "Versturen mislukt. Probeer het opnieuw." };
  }

  return { ok: true };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
