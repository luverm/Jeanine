// Single source of truth for the service catalogue. Mirrored to
// supabase/seed.sql and scripts/seed.mjs; the /api/admin/seed-services
// endpoint upserts this list against the live database.
//
// Categories are derived from slug prefix in the UI — there is no
// `category` column in the DB so the existing schema doesn't need a
// migration.

export type SeededService = {
  slug: string;
  name: string;
  description: string | null;
  kind: "regular" | "bridal";
  duration_min: number;
  buffer_min: number;
  price_cents: number;
  is_online_bookable: boolean;
  sort_order: number;
};

export const SEED_SERVICES: readonly SeededService[] = [
  // ─── Knippen ─────────────────────────────────────────────
  {
    slug: "knippen-dames",
    name: "Dames knippen + stylen",
    description: null,
    kind: "regular",
    duration_min: 60,
    buffer_min: 10,
    price_cents: 3495,
    is_online_bookable: true,
    sort_order: 110,
  },
  {
    slug: "knippen-teen",
    name: "Meiden knippen + stylen teen (12–18 jaar)",
    description: null,
    kind: "regular",
    duration_min: 50,
    buffer_min: 10,
    price_cents: 2995,
    is_online_bookable: true,
    sort_order: 120,
  },
  {
    slug: "knippen-junior",
    name: "Meiden knippen + stylen junior (6–12 jaar)",
    description: null,
    kind: "regular",
    duration_min: 40,
    buffer_min: 10,
    price_cents: 2595,
    is_online_bookable: true,
    sort_order: 130,
  },
  {
    slug: "knippen-mini",
    name: "Meiden knippen + stylen mini (0–6 jaar)",
    description: null,
    kind: "regular",
    duration_min: 30,
    buffer_min: 10,
    price_cents: 1795,
    is_online_bookable: true,
    sort_order: 140,
  },
  {
    slug: "pony-bijknippen",
    name: "Pony of curtain bangs bijknippen",
    description: null,
    kind: "regular",
    duration_min: 15,
    buffer_min: 5,
    price_cents: 995,
    is_online_bookable: true,
    sort_order: 150,
  },

  // ─── Kleuren ─────────────────────────────────────────────
  {
    slug: "kleur-highlights-half",
    name: "High en/of lowlights — Half head",
    description:
      "Subtiele, fijne plukjes die je haar een frisse uitstraling geven.",
    kind: "regular",
    duration_min: 240,
    buffer_min: 15,
    price_cents: 13995,
    is_online_bookable: true,
    sort_order: 310,
  },
  {
    slug: "kleur-highlights-full",
    name: "High en/of lowlights — Full head",
    description: null,
    kind: "regular",
    duration_min: 240,
    buffer_min: 15,
    price_cents: 15995,
    is_online_bookable: true,
    sort_order: 320,
  },
  {
    slug: "kleur-toner",
    name: "Toner / glansbehandeling (incl. föhnen en stylen)",
    description:
      "Voor het opfrissen van blond, neutraliseren van warmte of extra glans.",
    kind: "regular",
    duration_min: 80,
    buffer_min: 10,
    price_cents: 4495,
    is_online_bookable: true,
    sort_order: 330,
  },
  {
    slug: "kleur-spoeling",
    name: "Kleurspoeling (incl. föhnen en stylen)",
    description:
      "Verfrissende, tijdelijke kleuring die glans en diepte geeft. Wast geleidelijk uit.",
    kind: "regular",
    duration_min: 120,
    buffer_min: 15,
    price_cents: 6995,
    is_online_bookable: true,
    sort_order: 340,
  },

  // ─── Party hair & make-up ────────────────────────────────
  {
    slug: "feestkapsel",
    name: "Feestkapsel",
    description:
      "Kom met schoon, droog haar: graag vooraf 2 keer wassen met shampoo.",
    kind: "regular",
    duration_min: 90,
    buffer_min: 15,
    price_cents: 4995,
    is_online_bookable: true,
    sort_order: 210,
  },
  {
    slug: "feestkapsel-extensions",
    name: "Feestkapsel incl. clip-in haarextensions",
    description:
      "Kom met schoon, droog haar: graag vooraf 2 keer wassen met shampoo.",
    kind: "regular",
    duration_min: 90,
    buffer_min: 15,
    price_cents: 7495,
    is_online_bookable: true,
    sort_order: 220,
  },
  {
    slug: "feestkapsel-makeup",
    name: "Feestkapsel incl. make-up",
    description: null,
    kind: "regular",
    duration_min: 120,
    buffer_min: 15,
    price_cents: 7495,
    is_online_bookable: true,
    sort_order: 230,
  },
  {
    slug: "feestkapsel-mini",
    name: "Feestkapsel mini (0–6 jaar)",
    description: null,
    kind: "regular",
    duration_min: 30,
    buffer_min: 10,
    price_cents: 1995,
    is_online_bookable: true,
    sort_order: 240,
  },
  {
    slug: "feestkapsel-kids",
    name: "Feestkapsel kids (6–12 jaar)",
    description: null,
    kind: "regular",
    duration_min: 45,
    buffer_min: 10,
    price_cents: 2995,
    is_online_bookable: true,
    sort_order: 250,
  },

  // ─── Bridal (request only — routed to /bruid/contact) ────
  {
    slug: "bruid-locatie-haar",
    name: "Aanvraag: bruidshaarstyling op locatie incl. proefsessie",
    description: null,
    kind: "bridal",
    duration_min: 240,
    buffer_min: 30,
    price_cents: 24000,
    is_online_bookable: false,
    sort_order: 410,
  },
  {
    slug: "bruid-locatie-haar-makeup",
    name: "Aanvraag: bruidshaarstyling en make-up op locatie incl. proefsessie",
    description: null,
    kind: "bridal",
    duration_min: 240,
    buffer_min: 30,
    price_cents: 31500,
    is_online_bookable: false,
    sort_order: 420,
  },
  {
    slug: "bruid-proefsessie-haar",
    name: "Proefsessie bruidshaarstyling",
    description: null,
    kind: "bridal",
    duration_min: 180,
    buffer_min: 30,
    price_cents: 0,
    is_online_bookable: false,
    sort_order: 430,
  },
  {
    slug: "bruid-proefsessie-haar-makeup",
    name: "Proefsessie bruidshaarstyling en make-up",
    description: null,
    kind: "bridal",
    duration_min: 210,
    buffer_min: 30,
    price_cents: 0,
    is_online_bookable: false,
    sort_order: 440,
  },
];

/** UI-side categories, derived from slug prefix. */
export type Category = {
  key: string;
  label: string;
  slugPrefix: string;
};

export const SERVICE_CATEGORIES: readonly Category[] = [
  { key: "knippen", label: "Knippen", slugPrefix: "knippen-" },
  { key: "kleuren", label: "Kleuren", slugPrefix: "kleur-" },
  { key: "feest", label: "Party hair & make-up", slugPrefix: "feestkapsel" },
];

export function categoryForSlug(slug: string): Category | null {
  for (const c of SERVICE_CATEGORIES) {
    if (slug.startsWith(c.slugPrefix) || slug === c.slugPrefix.replace(/-$/, "")) {
      return c;
    }
  }
  // Pony bijknippen — fold into Knippen for grouping purposes.
  if (slug === "pony-bijknippen") return SERVICE_CATEGORIES[0];
  return null;
}
