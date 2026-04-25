import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const ALLOWED_NEXT = /^\/[a-z][a-z0-9/_-]*$/i;

/**
 * After Supabase confirms the magic-link OTP, claim the seeded
 * staff row for this auth user — but only if (a) this user isn't
 * already linked to a staff row and (b) at least one staff row has
 * `user_id IS NULL` waiting to be claimed.
 *
 * Runs with the service-role client so it bypasses the RLS policies
 * that would otherwise block a brand-new auth user (who isn't yet in
 * the staff table) from updating it.
 */
async function claimStaffIfUnlinked(userId: string, email: string | null) {
  const svc = createSupabaseServiceClient();

  const { data: existing } = await svc
    .from("staff")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return;

  const { data: orphan } = await svc
    .from("staff")
    .select("id")
    .is("user_id", null)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!orphan) return;

  const update: { user_id: string; email?: string } = { user_id: userId };
  if (email) update.email = email;
  await svc.from("staff").update(update).eq("id", orphan.id);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/dashboard";
  const next = ALLOWED_NEXT.test(requestedNext) ? requestedNext : "/dashboard";

  const supabase = await createSupabaseServerClient();

  let authed = false;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "magiclink" | "email",
    });
    authed = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authed = !error;
  }

  if (!authed) {
    return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    try {
      await claimStaffIfUnlinked(user.id, user.email ?? null);
    } catch (e) {
      console.error("[auth] claimStaffIfUnlinked failed", e);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
