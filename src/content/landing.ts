export const landing = {
  hero: {
    eyebrow: "Bruids- & feestkapsels in Zeeland",
    title: "Jouw mooiste dag, perfect gestyled",
    subtitle:
      "Persoonlijke styling voor bruiden, bruidsmeisjes en feestgangers — bij jou op locatie of in de studio in Krabbendijke.",
    primaryCta: { label: "Boek afspraak", href: "/boeken" },
    secondaryCta: { label: "Bruid? Plan consult", href: "/bruid" },
  },
  about: {
    title: "Over Jeanine",
    body: "Bij Hair and Bridal by Jeanine staan jouw mooiste momenten centraal — van de trouwdag tot een gala-avond of feestelijke gelegenheid. Vanuit de studio in Krabbendijke styled Jeanine kapsels die passen bij jou, je look en je dag. Persoonlijk, rustig en met oog voor detail.\n\nVoor bruidsstyling kom je vooraf op consult zodat we samen de planning, locatie en stijl voor de grote dag uitwerken — en op de dag zelf alles soepel verloopt.",
  },
  // Reviews are intentionally empty in v1 — the landing page falls back to
  // an Instagram CTA when the array is empty. Add real testimonials here
  // when ready (e.g. { quote: "...", author: "Sophie K." }).
  reviews: [] as ReadonlyArray<{ quote: string; author: string }>,
  bridal: {
    title: "Bruidsstyling",
    intro:
      "Jouw trouwdag verdient een styliste die meedenkt, niet alleen meekrult. Plan een vrijblijvend consult — we bespreken jouw look, locatie en planning.",
    bullets: [
      "Persoonlijk consult vooraf",
      "Proefsessie ruim voor de dag",
      "Op locatie of in de studio",
      "Bruidsmeisjes, moeder van de bruid en bridal party in één pakket",
    ],
    cta: { label: "Plan een consult", href: "/bruid/contact" },
  },
} as const;
