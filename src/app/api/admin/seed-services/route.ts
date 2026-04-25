// One-shot reseed endpoint: upserts the canonical service catalogue
// from src/content/services.ts into the database. Safe to call
// repeatedly — uses ON CONFLICT (slug) DO UPDATE.
//
// Auth: Bearer token equal to ADMIN_ICS_TOKEN (the same env var that
// already exists for the iCal feed). Without it the route 401s.
//
// Usage from a browser address bar:
//   /api/admin/seed-services?token=<ADMIN_ICS_TOKEN>
//
// Or via curl:
//   curl -H "Authorization: Bearer $ADMIN_ICS_TOKEN" \
//     https://<host>/api/admin/seed-services

import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getServerEnv } from "@/lib/env";
import { SEED_SERVICES } from "@/content/services";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

async function handle(req: Request) {
  const { ADMIN_ICS_TOKEN } = getServerEnv();
  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token");
  const headerToken = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const provided = queryToken ?? headerToken;
  if (!provided || provided !== ADMIN_ICS_TOKEN) return unauthorized();

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("services")
    .upsert(
      SEED_SERVICES.map((s) => ({ ...s, is_active: true })),
      { onConflict: "slug" },
    )
    .select("slug, name, kind, duration_min, price_cents, is_online_bookable");
  if (error) {
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 },
    );
  }
  return NextResponse.json({
    ok: true,
    upserted: data?.length ?? 0,
    services: data,
  });
}

export const GET = handle;
export const POST = handle;
