// Seed runner — inserts the same data as supabase/seed.sql via the
// REST API using the service-role key. Idempotent: safe to re-run.
//
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", ".env.local");
try {
  const txt = readFileSync(envPath, "utf-8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // env file optional
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const STAFF_ID = "00000000-0000-0000-0000-000000000001";
const STAFF_EMAIL = "jeanine@example.com";

const services = [
  { slug: "knippen", name: "Knippen", description: "Wassen, knippen, drogen.", kind: "regular", duration_min: 45, buffer_min: 10, price_cents: 4500, is_online_bookable: true, sort_order: 10 },
  { slug: "kleuren", name: "Kleuren", description: "Volledige kleurbehandeling incl. wassen.", kind: "regular", duration_min: 120, buffer_min: 15, price_cents: 9500, is_online_bookable: true, sort_order: 20 },
  { slug: "fohnen", name: "Föhnen / styling", description: "Föhnen of styling zonder knip.", kind: "regular", duration_min: 30, buffer_min: 5, price_cents: 3000, is_online_bookable: true, sort_order: 30 },
  { slug: "bruid-proefsessie", name: "Bruid — proefsessie", description: "Proefsessie voor de grote dag.", kind: "bridal", duration_min: 90, buffer_min: 15, price_cents: 12000, is_online_bookable: false, sort_order: 40 },
  { slug: "bruid-styling", name: "Bruid — styling op dag", description: "Volledige hairstyling op de trouwdag.", kind: "bridal", duration_min: 180, buffer_min: 30, price_cents: 35000, is_online_bookable: false, sort_order: 50 },
];

async function main() {
  // Staff
  const { error: staffErr } = await supabase
    .from("staff")
    .upsert(
      { id: STAFF_ID, display_name: "Jeanine", email: STAFF_EMAIL, is_active: true },
      { onConflict: "id" },
    );
  if (staffErr) throw staffErr;
  console.log("✓ staff");

  // Services
  const { error: svcErr } = await supabase
    .from("services")
    .upsert(services, { onConflict: "slug" });
  if (svcErr) throw svcErr;
  console.log(`✓ ${services.length} services`);

  // Opening hours: Mon–Fri 09:00–17:00. Saturdays reserved for bridal.
  await supabase.from("opening_hours").delete().eq("staff_id", STAFF_ID);
  const hours = [1, 2, 3, 4, 5].map((weekday) => ({
    staff_id: STAFF_ID,
    weekday,
    start_time: "09:00:00",
    end_time: "17:00:00",
  }));
  const { error: hoursErr } = await supabase.from("opening_hours").insert(hours);
  if (hoursErr) throw hoursErr;
  console.log(`✓ ${hours.length} opening_hours rows`);

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
